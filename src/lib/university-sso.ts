import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import config from './sso-config.json';
import { validSsoConfig } from './sso-policy';
import { parseSession } from './portal';
WebBrowser.maybeCompleteAuthSession();
export const ssoConfigured=()=>validSsoConfig(config,Platform.OS);
export const MOBILE_REDIRECT='unicodesis://oauth/callback';
// University-owned broker, NOT the existing username-only ExternalStudentLogin route.
// Server must verify Google identity and return only the matching student's portal session.
export async function universityGoogleSignIn(){
 if(!ssoConfigured())throw new Error('SSO_NOT_CONFIGURED');
 const request=new AuthSession.AuthRequest({
  clientId:Platform.OS==='ios'?config.iosClientId:config.androidClientId,
  redirectUri:MOBILE_REDIRECT,responseType:AuthSession.ResponseType.Code,usePKCE:true,
  codeChallengeMethod:AuthSession.CodeChallengeMethod.S256,scopes:['openid','profile'],
  extraParams:{provider:'google'},
 });
 const result=await request.promptAsync({authorizationEndpoint:config.authorizationEndpoint});
 if(result.type==='cancel'||result.type==='dismiss')return null;
 if(result.type!=='success'||!result.params.code||result.params.state!==request.state||!request.codeVerifier)throw new Error('SSO_FAILED');
 const body=new URLSearchParams({grant_type:'authorization_code',client_id:request.clientId,
  code:result.params.code,redirect_uri:MOBILE_REDIRECT,code_verifier:request.codeVerifier});
 const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),20000);
 try{
  const res=await fetch(config.tokenEndpoint,{method:'POST',redirect:'error',signal:abort.signal,
   headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body:body.toString()});
  if(!res.ok)throw new Error('SSO_FAILED');
  const raw=await res.text();if(raw.length>22000)throw new Error('SSO_INVALID');
  const reply=JSON.parse(raw);
  const session=parseSession(reply.student);
  if(!session)throw new Error('SSO_INVALID');
  return session;
 }finally{clearTimeout(timeout);}
}