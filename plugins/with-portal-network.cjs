const {withAndroidManifest,withDangerousMod}=require('expo/config-plugins');
const fs=require('fs'),path=require('path');
module.exports=function(config){
 config=withAndroidManifest(config,c=>{
   const app=c.modResults.manifest.application[0];
   // HTTP exception only for this legacy portal, not every domain.
   app.$['android:networkSecurityConfig']='@xml/portal_network_security';
   delete app.$['android:usesCleartextTraffic'];
   return c;
 });
 return withDangerousMod(config,['android',async c=>{
   const dir=path.join(c.modRequest.platformProjectRoot,'app/src/main/res/xml');
   fs.mkdirSync(dir,{recursive:true});
   fs.writeFileSync(path.join(dir,'portal_network_security.xml'),`<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false"><trust-anchors><certificates src="system"/></trust-anchors></base-config>
  <domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">unicodesis.su.edu.eg</domain></domain-config>
</network-security-config>`);
   return c;
 }]);
};