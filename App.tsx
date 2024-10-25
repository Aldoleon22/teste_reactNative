import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Demande d’autorisation pour Android 6.0 et plus
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      }
    }
    requestPermissions();
  }, []);

  // Recherche des appareils Bluetooth
  const scanDevices = async () => {
    try {
      const availableDevices = await RNBluetoothClassic.list();
      setDevices(availableDevices);
    } catch (error) {
      console.error(error);
    }
  };

  // Connexion à un appareil
  const connectToDevice = async (device) => {
    try {
      const connection = await device.connect();
      if (connection) {
        setConnectedDevice(device);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Envoi d’un message via Bluetooth
  const sendMessage = async () => {
    if (connectedDevice && message) {
      try {
        await connectedDevice.write(message + '\n');
        setMessages([...messages, { sent: true, text: message }]);
        setMessage('');
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Réception des messages (implémentation simple pour tester)
  const readMessages = async () => {
    if (connectedDevice) {
      try {
        const received = await connectedDevice.read();
        setMessages([...messages, { sent: false, text: received }]);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Scan Devices" onPress={scanDevices} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <Button title={`Connect to ${item.name}`} onPress={() => connectToDevice(item)} />
        )}
      />
      {connectedDevice && (
        <>
          <Text>Connected to {connectedDevice.name}</Text>
          <TextInput
            placeholder="Type a message"
            value={message}
            onChangeText={setMessage}
            style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
          />
          <Button title="Send Message" onPress={sendMessage} />
          <Button title="Receive Messages" onPress={readMessages} />
          <FlatList
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text style={{ color: item.sent ? 'blue' : 'green' }}>
                {item.sent ? 'Sent: ' : 'Received: '}{item.text}
              </Text>
            )}
          />
        </>
      )}
    </View>
  );
}
