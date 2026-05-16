import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';

const TermsConditionsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Terms & Conditions</Text>
        
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>By using our food delivery service, you agree to these terms and conditions.</Text>
        
        <Text style={styles.sectionTitle}>2. Service Description</Text>
        <Text style={styles.text}>We provide a platform connecting customers with local restaurants for food ordering and delivery.</Text>
        
        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.text}>• Provide accurate delivery information</Text>
        <Text style={styles.text}>• Be available to receive orders</Text>
        <Text style={styles.text}>• Pay for orders as agreed</Text>
        <Text style={styles.text}>• Use the service lawfully</Text>
        
        <Text style={styles.sectionTitle}>4. Order Accuracy</Text>
        <Text style={styles.text}>While we strive for accuracy, restaurant partners are responsible for order preparation. Report issues immediately.</Text>
        
        <Text style={styles.sectionTitle}>5. Payment Terms</Text>
        <Text style={styles.text}>Payment is due at time of order. We accept credit cards, debit cards, and digital wallets.</Text>
        
        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.text}>Our liability is limited to the order value. We are not responsible for food quality issues beyond our control.</Text>
        
        <Text style={styles.sectionTitle}>7. Privacy</Text>
        <Text style={styles.text}>Your personal information is protected according to our Privacy Policy.</Text>
        
        <Text style={styles.sectionTitle}>8. Modifications</Text>
        <Text style={styles.text}>We reserve the right to modify these terms. Continued use constitutes acceptance of changes.</Text>
        
        <Text style={styles.sectionTitle}>9. Contact Information</Text>
        <Text style={styles.text}>For questions about these terms, contact legal@foodapp.com</Text>
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

export default TermsConditionsScreen;