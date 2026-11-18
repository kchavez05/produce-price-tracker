#!/usr/bin/env bash
# Run a command with a per-attempt timeout and a bounded number of attempts.
#
# Used for the Playwright system-dependency install in CI (#790): a stalled apt mirror used to hold a
# browser job until its 10-minute job timeout. Callers use 120 s x 3 for install-deps and 180 s x 2 for
# install --with-deps (which also downloads browsers). Worst case is about 6.5 to 7 minutes including the
# 10 s SIGKILL grace, the pause and the dpkg repair between attempts, on top of checkout/npm ci/cache steps
# that run earlier in the same job. Healthy installs take 24 to 59 s.
#
# Usage: retry-with-timeout.sh <seconds-per-attempt> <attempts> <command> [args...]
#
# Environment:
#   RETRY_CLEANUP   command to run between a failed attempt and the next one (default: repair an
#                   interrupted dpkg state, which a killed apt-get can leave behind). Set to ':' to skip.
#   RETRY_PAUSE     seconds to wait between attempts (default 5).
set -u

if [ "$#" -lt 3 ]; then
  echo "usage: $0 <seconds-per-attempt> <attempts> <command> [args...]" >&2
  exit 2
fi

seconds="$1"; attempts="$2"; shift 2
case "$seconds$attempts" in *[!0-9]*) echo "seconds and attempts must be whole numbers" >&2; exit 2 ;; esac
[ "$seconds" -ge 1 ] && [ "$attempts" -ge 1 ] || { echo "seconds and attempts must be at least 1" >&2; exit 2; }

cleanup="${RETRY_CLEANUP-sudo dpkg --configure -a}"
pause="${RETRY_PAUSE:-5}"

attempt=1
while [ "$attempt" -le "$attempts" ]; do
  echo "::group::Attempt $attempt of $attempts (limit ${seconds}s): $*"
  # -k: SIGKILL if the command ignores SIGTERM; the signal reaches the whole group, so apt-get children stop too.
  timeout -k 10 "$seconds" "$@"
  status=$?
  echo "::endgroup::"
  if [ "$status" -eq 0 ]; then
    exit 0
  fi
  if [ "$status" -eq 124 ] || [ "$status" -eq 137 ]; then
    echo "::warning::Attempt $attempt of $attempts timed out after ${seconds}s: $*"
  else
    echo "::warning::Attempt $attempt of $attempts failed with exit code $status: $*"
  fi
  if [ "$attempt" -lt "$attempts" ]; then
    bash -c "$cleanup" || true
    sleep "$pause"
  fi
  attempt=$((attempt + 1))
done

echo "::error::All $attempts attempts failed: $*"
exit 1
