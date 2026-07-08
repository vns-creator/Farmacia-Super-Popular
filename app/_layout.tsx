// app/_layout.tsx

import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AdminOrderNotificationListener } from "../components/AdminOrderNotificationListener";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CarrinhoProvider } from "../context/CarContext";
import { FilialProvider } from "../context/FilialContext";

function RootLayoutNav() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1b5e20" />
      </View>
    );
  }

  return (
    <>
      <AdminOrderNotificationListener />
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="pedidos" />
        <Stack.Screen name="pedido-detalhes" />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="farmacia" />
        <Stack.Screen name="privacidade" />
        <Stack.Screen name="termos" />
        <Stack.Screen name="sobre-sistema" />
        <Stack.Screen name="editar-dados" />
        <Stack.Screen name="admin/pedidos" />
        <Stack.Screen name="admin/relatorios" />
        <Stack.Screen name="admin/produtos" />
        <Stack.Screen name="admin/usuarios" />
        <Stack.Screen name="admin/alertas" />
        <Stack.Screen name="entregador/entregas" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FilialProvider>
        <CarrinhoProvider>
          <RootLayoutNav />
        </CarrinhoProvider>
      </FilialProvider>
    </AuthProvider>
  );
}
