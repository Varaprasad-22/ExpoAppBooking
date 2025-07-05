import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../fireaseConfig";

type OrderItem = {
  id: string;
  orderTime: { seconds: number; nanoseconds: number };
  phone: string;
  address: {
    Line1: string;
    city: string;
    pincode: string;
    state: string;
  };
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
};

function History() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [login, setLogin] = useState(false);
  const [storedPhone, setStoredPhone] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchOrders = async () => {
      const phone = await AsyncStorage.getItem("userPhone");
      setStoredPhone(phone);
      if (!phone) {
        setLogin(false);
        return;
      }
      setLogin(true);
      const q = query(collection(db, "orders"), where("phone", "==", phone));
      const docs = await getDocs(q);
      setItems(docs.docs.map(d => ({ id: d.id, ...d.data() } as OrderItem)));
    };
    fetchOrders();
  }, [isFocused]);

  const generatePDF = async (order: OrderItem) => {
    const dateObj = new Date(order.orderTime.seconds * 1000);
    const formattedDate = dateObj.toLocaleDateString("en-GB");

    const itemsHtml = order.items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${item.quantity * item.price}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Order Summary</h1>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <h2>Address</h2>
          <p>${order.address.Line1}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}</p>
          <h2>Items</h2>
          <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
            ${itemsHtml}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF");
      console.error("PDF Error", error);
    }
  };

  let counter = 1;

  return (
    <SafeAreaView>
      <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ margin: "auto", fontWeight: "bold", fontSize: 20, marginBottom: 15 }}>History</Text>
        {login ? (
          <View>
            <View style={{ flexDirection: 'row', backgroundColor: '#eef', gap: 70, padding: 10, borderRadius: 30, justifyContent: "space-around" }}>
              <Text style={styles.text}>Sno</Text>
              <Text style={styles.text}>Date</Text>
              <Text style={styles.text}>Download</Text>
            </View>
            <View style={{ margin: 10, flexDirection: 'column', padding: 5, borderBottomWidth: 2, borderRadius: 30 }}>
              {items.length > 0 ? (
                <>
                  {items.map((item, id) => {
                    const dateObj = new Date(item.orderTime.seconds * 1000);
                    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
                    return (
                      <View key={id} style={{ flexDirection: "row", justifyContent: "space-between",borderTopWidth:2,borderRadius:20,padding:20, alignItems: "center", width: "100%" }}>
                        <Text>{counter++}</Text>
                        <Text>{formattedDate}</Text>
                        <TouchableOpacity onPress={() => generatePDF(item)}>
                          <FontAwesome style={{ left: -16 }} size={19} name="download" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </>
              ) : (
                <Text>Order Items are Empty</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={{ fontWeight: "bold", margin: "auto" }}> Please Login To View</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default History;
