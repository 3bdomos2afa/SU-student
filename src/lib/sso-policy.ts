export type SsoConfig={authorizationEndpoint:string;tokenEndpoint:string;androidClientId:string;iosClientId:string};
export function validSsoConfig(config:SsoConfig,platform:string){
 if(!['ios','android'].includes(platform))return false;
 try{
  const auth=new URL(config.authorizationEndpoint),token=new URL(config.tokenEndpoint);
  return auth.protocol==='https:'&&token.protocol==='https:'&&auth.origin===token.origin
   &&!auth.username&&!auth.password&&!token.username&&!token.password&&!auth.hash&&!token.hash
   &&!!(platform==='ios'?config.iosClientId:config.androidClientId).trim();
 }catch{return false;}
}