export interface AiRequestTicket { id:string; owner:string|null; context:string; controller:AbortController }
/** One current user action; cancelling or replacing it permanently invalidates late results. */
export function createAiRequestFence() {
  let current:AiRequestTicket|null=null;
  const cancel=()=>{current?.controller.abort();current=null;};
  return {
    cancel,
    begin(owner:string|null,context:string):AiRequestTicket {
      cancel(); const ticket={id:crypto.randomUUID(),owner,context,controller:new AbortController()};current=ticket;return ticket;
    },
    isCurrent(ticket:AiRequestTicket,owner:string|null,context:string):boolean {
      return current===ticket && !ticket.controller.signal.aborted && owner===ticket.owner && context===ticket.context;
    },
    complete(ticket:AiRequestTicket){if(current===ticket)current=null;},
  };
}

export function aiRetryHint(header:string|null):string {
  const seconds=header===null?0:Number(header);
  if(!Number.isSafeInteger(seconds)||seconds<=0||seconds>2_678_400)return '';
  const [amount,unit]:[number,string]=seconds<60?[seconds,'second']:seconds<3600?[Math.ceil(seconds/60),'minute']:
    seconds<86400?[Math.ceil(seconds/3600),'hour']:[Math.ceil(seconds/86400),'day'];
  return ` Try again in about ${amount} ${unit}${amount===1?'':'s'}.`;
}
