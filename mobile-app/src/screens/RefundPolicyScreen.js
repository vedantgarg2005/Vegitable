import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';

const RefundPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Refund Policy</Text>
        
        <Text style={styles.sectionTitle}>Refund Eligibility</Text>
        <Text style={styles.text}>Refunds are available for:</Text>
        <Text style={styles.text}>• Order not delivered within 60 minutes</Text>
        <Text style={styles.text}>• Incorrect order received</Text>
        <Text style={styles.text}>• Food quality issues (spoiled/contaminated)</Text>
        <Text style={styles.text}>• Restaurant cancellation</Text>
        
        <Text style={styles.sectionTitle}>Non-Refundable Items</Text>
        <Text style={styles.text}>• Orders delivered as requested</Text>
        <Text style={styles.text}>• Customer unavailable for delivery</Text>
        <Text style={styles.text}>• Change of mind after order confirmation</Text>
        <Text style={styles.text}>• Delivery delays due to weather/traffic</Text>
        
        <Text style={styles.sectionTitle}>Refund Process</Text>
        <Text style={styles.text}>1. Report issue within 2 hours of delivery time</Text>
        <Text style={styles.text}>2. Contact customer support with order details</Text>
        <Text style={styles.text}>3. Provide photos if applicable</Text>
        <Text style={styles.text}>4. Refund processed within 3-5 business days</Text>
        
        <Text style={styles.sectionTitle}>Refund Methods</Text>
        <Text style={styles.text}>• Original payment method (preferred)</Text>
        <Text style={styles.text}>• App wallet credit</Text>
        <Text style={styles.text}>• Bank transfer (if original method unavailable)</Text>
        
        <Text style={styles.sectionTitle}>Partial Refunds</Text>
        <Text style={styles.text}>Available for missing items or partial order issues. Amount calculated based on item value.</Text>
        
        <Text style={styles.sectionTitle}>Processing Time</Text>
        <Text style={styles.text}>• Credit/Debit cards: 3-5 business days</Text>
        <Text style={styles.text}>• Digital wallets: 1-2 business days</Text>
        <Text style={styles.text}>• App wallet: Instant</Text>
        
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <Text style={styles.text}>For refund requests: refunds@foodapp.com or use in-app support chat</Text>
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

export default RefundPolicyScreen;