import { isPortalURL } from './portal';
export function navigationPolicy(url:string):'portal'|'external'|'blocked'{
 try{
  const u=new URL(url);
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return 'blocked';
  if(isPortalURL(url))return 'portal';
  // Never forward bearer/session secrets in URLs to another application.
  if([...u.searchParams.keys()].some(k=>/token|authorization|password|credential|code_verifier/i.test(k)))return 'blocked';
  if(/(?:token|password|credential)=/i.test(u.hash))return 'blocked';
  return 'external';
 }catch{return 'blocked';}
}