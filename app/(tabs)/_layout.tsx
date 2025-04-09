// app/(tabs)/_layout.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

import ExploreScreen from './explore';
import AnagraficiScreen from './anagrafici';
import CreaEventoScreen from './creaevento';
import EventiScreen from './eventi';
import IMieiEventiScreen from './imieieeventi';
import DettagliEventiScreen from './dettaglieventi';
import CreaGruppoScreen from './creagruppo';
import GestioneGruppiScreen from './gestionegruppi';
import IMieiGruppiScreen from './imieigruppi';

const Drawer = createDrawerNavigator();

export default function TabsLayout() {
  const { user, loading, role } = useContext(AuthContext);

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: 'front',
        headerShown: true,
        drawerActiveTintColor: '#007aff',
      }}
    >
      <Drawer.Screen
        name="Esplora"
        component={ExploreScreen}
        options={{
          drawerIcon: ({ color, size }) => <Icon name="compass-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Eventi"
        component={EventiScreen}
        options={{
          drawerIcon: ({ color, size }) => <Icon name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="I Miei Eventi"
        component={IMieiEventiScreen}
        options={{
          drawerIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} />,
        }}
      />
          <Drawer.Screen
        name="I Miei Gruppi"
        component={IMieiGruppiScreen}
        options={{
          drawerIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} />,
        }}
      />

      {/* ✅ Only for teachers */}
      {role === 'teacher' && (
        <>
          <Drawer.Screen
            name="Anagrafici"
            component={AnagraficiScreen}
            options={{
              drawerIcon: ({ color, size }) => <Icon name="people-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="Dettagli Eventi"
            component={DettagliEventiScreen}
            options={{
              drawerIcon: ({ color, size }) => <Icon name="list-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="Crea Evento"
            component={CreaEventoScreen}
            options={{
              drawerIcon: ({ color, size }) => <Icon name="add-circle-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="Crea Gruppo"
            component={CreaGruppoScreen}
            options={{
              drawerIcon: ({ color, size }) => <Icon name="people-circle-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="Gestione Gruppi"
            component={GestioneGruppiScreen}
            options={{
              drawerIcon: ({ color, size }) => <Icon name="settings-outline" size={size} color={color} />,
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
}
