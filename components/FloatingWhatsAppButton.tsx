import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

type FloatingWhatsAppButtonProps = {
  bottom?: number;
};

export function FloatingWhatsAppButton({
  bottom = 24,
}: FloatingWhatsAppButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.botao, { bottom }]}
      onPress={() => router.push("/farmacia" as any)}
      activeOpacity={0.9}
    >
      <Ionicons name="logo-whatsapp" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1b5e20",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 9,
    zIndex: 20,
  },
});
