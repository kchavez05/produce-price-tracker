import { randomUUID } from 'node:crypto';
import { pantryCatalog } from '@/lib/pantry/model';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import type { CookingVesselArchetype, DietaryConstraint, MacroGoal, StoreChain } from '@/types/domain';
import { AiAccessError } from './access-errors';
export interface MealPlanRequest {
  requestId:string; pinnedIngredientIds:string[]; onHandIngredientIds?:string[]; targetServings:4|6|8;
  customPreference:string; storeFilter:'ALL'|StoreChain; macroGoal:MacroGoal; dietaryConstraints:DietaryConstraint[];
  applianceFilter:CookingVesselArchetype; zipCode:string; cityLabel:string;
}
const fields=new Set(['requestId','pinnedIngredientIds','onHandIngredientIds','targetServings','customPreference','storeFilter','macroGoal','dietaryConstraints','applianceFilter','zipCode','cityLabel']);
function invalid():never {throw new AiAccessError('INVALID_REQUEST');}
const pantryIds=new Set(pantryCatalog.keys());
const marketIds=new Set(CANONICAL_INGREDIENTS.map(ingredient=>ingredient.id));
function ids(value:unknown,allowed:ReadonlySet<string>):string[] {
  if (!Array.isArray(value) || value.length>allowed.size || value.some(id=>typeof id!=='string'||!allowed.has(id))) return invalid();
  return [...new Set(value)] as string[];
}
function choice<T extends string|number>(value:unknown, choices:readonly T[], fallback:T):T {
  if (value===undefined) return fallback;
  if (!choices.includes(value as T)) return invalid(); return value as T;
}
function text(value:unknown,max:number,fallback=''):string {
  if (value===undefined) return fallback;
  if (typeof value!=='string'||value.length>max) return invalid(); return value.trim();
}
export async function parseMealPlanRequest(request:Request):Promise<MealPlanRequest> {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json') return invalid();
  const reader=request.body?.getReader(); if(!reader)return invalid();
  let size=0; const chunks:Uint8Array[]=[];
  try { while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();return invalid();}chunks.push(value);} }
  catch(error){if(error instanceof AiAccessError)throw error;return invalid();}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let body:unknown;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return invalid();}
  if(!body||typeof body!=='object'||Array.isArray(body))return invalid();const record=body as Record<string,unknown>;
  if(Object.hasOwn(record,'geminiApiKey'))throw new AiAccessError('CLIENT_UPDATE_REQUIRED');
  if(Object.keys(record).some(key=>!fields.has(key)))return invalid();
  const zipCode=text(record.zipCode,5,'80542');if(!/^\d{5}$/.test(zipCode))return invalid();
  const dietaryConstraints=record.dietaryConstraints===undefined?[]:record.dietaryConstraints;
  if(!Array.isArray(dietaryConstraints)||dietaryConstraints.length>4)return invalid();
  const requestId=text(record.requestId,36,randomUUID());if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))return invalid();
  return {requestId,zipCode,cityLabel:text(record.cityLabel,80,'Local Area'),customPreference:text(record.customPreference,1000),
    pinnedIngredientIds:record.pinnedIngredientIds===undefined?[]:ids(record.pinnedIngredientIds,marketIds),
    ...(record.onHandIngredientIds===undefined?{}:{onHandIngredientIds:ids(record.onHandIngredientIds,pantryIds)}),
    targetServings:choice(record.targetServings,[4,6,8] as const,6),storeFilter:choice(record.storeFilter,['ALL','KING_SOOPERS','SAFEWAY','ALDI','WALMART','TARGET','SPROUTS'] as const,'ALL'),
    macroGoal:choice(record.macroGoal,['ANY','HIGH_PROTEIN','LOW_CARB_KETO','CALORIE_CONSCIOUS','BALANCED_FAMILY'] as const,'ANY'),
    applianceFilter:choice(record.applianceFilter,['ANY','SLOW_COOKER_INSTANT_POT','DUTCH_OVEN_BRAISE','CASSEROLE_SHEET_PAN','BIG_BATCH_SKILLET'] as const,'ANY'),
    dietaryConstraints:[...new Set(dietaryConstraints.map(value=>choice(value,['GLUTEN_FREE','DAIRY_FREE','NUT_FREE','VEGETARIAN_PESCATARIAN'] as const,'GLUTEN_FREE')))]};
}
