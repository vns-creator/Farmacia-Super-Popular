// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1b5e20",
        tabBarInactiveTintColor: "#7a7a7a",
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#ffffff",
          borderTopColor: "#e0e0e0",
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="conta"
        options={{
          title: "Conta",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="carrinho"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="ofertas" options={{ href: null }} />
      <Tabs.Screen name="medicamentos" options={{ href: null }} />
      <Tabs.Screen name="perfumaria" options={{ href: null }} />
      <Tabs.Screen name="higiene" options={{ href: null }} />
      <Tabs.Screen name="baby" options={{ href: null }} />
    </Tabs>
  );
}

