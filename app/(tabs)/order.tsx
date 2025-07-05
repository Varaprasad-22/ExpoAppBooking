import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../fireaseConfig";
import { StoreContext } from "../storecontext/storeContextProvider";

function Order(){
    const {items}=useContext(StoreContext);
    const list=Object.values(items);
    const [line,setLine]=useState('');
    const total=list.reduce((sum, i) => sum +Number( i.price )* i.count, 0);
    const [pincode,setpincode]=useState('');
    const [State,setState]=useState('');
    const [city,setcity]=useState('');
    const [login,setlogin]=useState(false);
    const isFastReload=useIsFocused();
     useEffect(() => {
    const checkLogin = async () => {
      const x = await AsyncStorage.getItem("userPhone");
      if (!x) {
        setlogin(false);
      } else {
        setlogin(true);
      }
    };
    checkLogin();
  }, [isFastReload]);

  const uploadData = async () => {
    try {
      const phone = await AsyncStorage.getItem("userPhone");
      if (!phone) {
        Alert.alert("Login required to place order");
        return;
      }

      const orderData = {
        phone,
        orderTime: serverTimestamp(),
        items: list.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.count,
          price: item.price,
        })),
        address: {
          Line1: line,
          pincode,
          city,
          state: State,
        },
      };

      await addDoc(collection(db, "orders"), orderData);
      Alert.alert("Order placed ");
      alert("Placed Successfull")
      setLine('');
      setState('');
      setcity('');
      setpincode('')
      // optionally clear cart or navigate here
    } catch (error) {
      console.error("Order Error:", error);
      Alert.alert("Failed to place order ❌");
    }
  };
    return(
        <SafeAreaView>
        <ScrollView style={{padding:10}} showsVerticalScrollIndicator={false}>
            <Text style={{textAlign:"center",fontWeight:"bold",fontSize:20,marginBottom:15}}>Your Cart</Text>
            

            {list.length==0?(<Text style={{textAlign:"center",fontWeight:"bold",fontSize:16}}>Your cart is Empty Please Shop</Text>):(
                <View style={{padding:10}}>
                <View style={{ flexDirection: 'row', backgroundColor: '#eef',gap:70,padding:10,borderRadius:30,justifyContent:"space-around"}}>
                            <Text style={styles.text}>Name</Text>
                            <Text style={styles.text}>Qty</Text>
                            <Text style={styles.text}>Price</Text>
                </View>
                {list.map((item)=>(
                    <View key={item.id} style={{flexDirection:"row",gap:75,padding:10,borderBottomWidth:2,borderRadius:10,justifyContent:"space-around"}}>
                        <Text>{item.name}({item.size})</Text>
                        <Text>{item.count}</Text>
                        <Text>₹{Number(item.price)*item.count}</Text>
                    </View>
                ))}
                <Text style={{textAlign:"center",marginTop:10,fontWeight:"bold",fontSize:19,borderBottomWidth:2,borderRadius:10}}>Total {total}</Text>
                <View style={{marginTop:20}}>
                    <Text style={{textAlign:"center",fontWeight:"bold",fontSize:20,marginBottom:10}}>Address</Text>
                    <View>
                            <TextInput  placeholder="Enter Your address" style={{marginBottom:10,borderBottomWidth:2,borderRadius:10}} value={line}
                             onChangeText={(value)=>setLine(value)}/>
                         <TextInput  placeholder="Enter Your Pincode" style={{marginBottom:10,borderBottomWidth:2,borderRadius:10}} value={pincode}
                             onChangeText={(value)=>setpincode(value)}/>
                              <TextInput  placeholder="Enter Your City" style={{marginBottom:10,borderBottomWidth:2,borderRadius:10}} value={city}
                             onChangeText={(value)=>setcity(value)}/>
                              <TextInput  placeholder="Enter Your State" style={{marginBottom:10,borderBottomWidth:2,borderRadius:10}} value={State}
                             onChangeText={(value)=>setState(value)}/>
                    </View>
                </View>
                <View style={{flexDirection:"row",alignItems:"center" ,gap:10,borderWidth:2,width:70,padding:10,borderRadius:20,margin:"auto",backgroundColor:"#eef",elevation:8}}>
                {login?(<View style={{flexDirection:"row",alignItems:"center" ,gap:10}}><FontAwesome name="money"/>
                <Text onPress={uploadData}>Pay</Text></View>):(<><Text onPress={()=>router.push("/profile")}>Login</Text></>)}
                </View>
                </View>
            )}
        </ScrollView>
        </SafeAreaView>
    )
}
const styles=StyleSheet.create({
    text:{
        fontSize:15,
        fontWeight:"bold",
    }
})
export default Order;