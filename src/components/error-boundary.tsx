import { Component, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 // Do not send student data or error payloads to remote telemetry.
 render(){
  if(!this.state.failed)return this.props.children;
  return <View style={{flex:1,backgroundColor:'#F5F4EE',padding:28,justifyContent:'center',gap:18}}>
    <Text style={{fontSize:25,color:'#163B39',textAlign:'center'}}>تعذر عرض الصفحة · Something went wrong</Text>
    <Text style={{fontSize:16,textAlign:'center'}}>بياناتك المحفوظة لم تتغير. حاول إعادة فتح الصفحة.{'\n'}Your saved data is unchanged. Please retry.</Text>
    <Pressable accessibilityRole="button" onPress={()=>this.setState({failed:false})} style={{padding:18,backgroundColor:'#216B61',borderRadius:18}}><Text style={{textAlign:'center',color:'white'}}>إعادة المحاولة / Retry</Text></Pressable>
  </View>;
 }
}