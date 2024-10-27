import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, PermissionsAndroid, Alert, Platform } from 'react-native';
import BluetoothClassic from 'react-native-bluetooth-classic';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // Permissions granted for non-Android platforms
  };

  const isBluetoothEnabled = async () => {
    const enabled = await BluetoothClassic.isEnabled();
    if (!enabled) {
      Alert.alert('Bluetooth n\'est pas activé. Veuillez l\'activer pour continuer.');
    }
    return enabled;
  };

  const listDevices = async () => {
    try {
      const availableDevices = await BluetoothClassic.list();
      setDevices(availableDevices);
      console.log('Périphériques disponibles :', availableDevices);
    } catch (error) {
      console.error('Erreur lors de la recherche des périphériques :', error);
    }
  };

  const connectDevice = async (device) => {
    try {
      const connection = await BluetoothClassic.connect(device.id);
      setConnectedDevice(connection ? device : null);
      Alert.alert('Connecté à ' + device.name);
    } catch (error) {
      console.error('Erreur de connexion :', error);
      Alert.alert('Erreur', 'Impossible de se connecter à ' + device.name);
    }
  };

  const sendMessage = async () => {
    if (connectedDevice && message) {
      try {
        await BluetoothClassic.write(message);
        setMessages([...messages, { id: Date.now().toString(), text: message, from: 'Me' }]);
        setMessage('');
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message :', error);
      }
    } else {
      Alert.alert('Veuillez vous connecter à un périphérique pour envoyer un message');
    }
  };

  const receiveMessages = async () => {
    if (connectedDevice) {
      try {
        const receivedMessage = await BluetoothClassic.read();
        if (receivedMessage) {
          setMessages(prevMessages => [...prevMessages, { id: Date.now().toString(), text: receivedMessage, from: connectedDevice.name }]);
        }
      } catch (error) {
        console.error('Erreur lors de la réception du message :', error);
      }
    }
  };

  useEffect(() => {
    const requestPermissionsAndListDevices = async () => {
      const hasPermissions = await requestBluetoothPermissions();
      if (hasPermissions) {
        const bluetoothEnabled = await isBluetoothEnabled();
        if (bluetoothEnabled) {
          await listDevices();
        }
      }
    };

    requestPermissionsAndListDevices();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(receiveMessages, 1000); // Vérifiez les messages toutes les secondes
    return () => clearInterval(intervalId);
  }, [connectedDevice]);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Messagerie Bluetooth</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 10 }}>
            <Text>{item.name}</Text>
            <Button title="Se connecter" onPress={() => connectDevice(item)} />
          </View>
        )}
        ListEmptyComponent={<Text>Aucun périphérique trouvé.</Text>}
      />

      {connectedDevice && (
        <View style={{ marginVertical: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Connecté à : {connectedDevice.name}</Text>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Text style={{ marginVertical: 5, color: item.from === 'Me' ? 'blue' : 'green' }}>
                {item.from}: {item.text}
              </Text>
            )}
          />
          <TextInput
            placeholder="Tapez votre message"
            value={message}
            onChangeText={setMessage}
            style={{ borderWidth: 1, borderColor: 'gray', padding: 10, marginVertical: 10 }}
          />
          <Button title="Envoyer le message" onPress={sendMessage} />
        </View>
      )}
    </View>
  );
};

export default App;
