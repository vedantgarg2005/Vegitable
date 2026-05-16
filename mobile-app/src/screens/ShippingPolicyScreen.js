import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';

const ShippingPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Shipping & Delivery Policy</Text>
        
        <Text style={styles.sectionTitle}>Delivery Areas</Text>
        <Text style={styles.text}>We deliver to all areas within a 15km radius of our partner restaurants.</Text>
        
        <Text style={styles.sectionTitle}>Delivery Times</Text>
        <Text style={styles.text}>• Standard delivery: 30-45 minutes</Text>
        <Text style={styles.text}>• Express delivery: 20-30 minutes (additional charges apply)</Text>
        <Text style={styles.text}>• Peak hours may extend delivery times by 10-15 minutes</Text>
        
        <Text style={styles.sectionTitle}>Delivery Charges</Text>
        <Text style={styles.text}>• Orders above $25: Free delivery</Text>
        <Text style={styles.text}>• Orders below $25: $3.99 delivery fee</Text>
        <Text style={styles.text}>• Express delivery: Additional $2.99</Text>
        
        <Text style={styles.sectionTitle}>Order Tracking</Text>
        <Text style={styles.text}>Real-time tracking available through the app once your order is confirmed.</Text>
        
        <Text style={styles.sectionTitle}>Delivery Instructions</Text>
        <Text style={styles.text}>Please ensure someone is available to receive the order. If unavailable, our delivery partner will attempt to contact you.</Text>
        
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.text}>For delivery issues, contact support at delivery@foodapp.com</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 8,
  },
});

export default ShippingPolicyScreen;