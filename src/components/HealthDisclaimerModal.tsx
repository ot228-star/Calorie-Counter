import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onAccept: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
};

/**
 * Shown once on first launch before the app is usable. Acceptance is
 * required to comply with health/wellness app review guidelines (Apple
 * 1.4.1, Play health policy) and to limit liability via the Terms.
 */
export function HealthDisclaimerModal({ visible, onAccept, onOpenPrivacy, onOpenTerms }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Inertia</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            <Text style={styles.body}>
              Inertia helps you log meals and estimate nutrition. The information it provides
              is for general informational purposes only and is not medical advice, diagnosis,
              or treatment.
              {"\n\n"}
              Calorie and macro estimates from photos can be inaccurate. Do not rely on Inertia
              for medical decisions, weight management programs, or treatment of any condition.
              Always consult a qualified healthcare professional before changing your diet,
              especially if you are pregnant, nursing, under 18, or have a medical condition.
              {"\n\n"}
              By tapping "I understand" you confirm that you accept the Terms of Service and
              acknowledge the Privacy Policy.
            </Text>
          </ScrollView>

          <View style={styles.linkRow}>
            {onOpenPrivacy ? (
              <TouchableOpacity onPress={onOpenPrivacy}>
                <Text style={styles.link}>Privacy policy</Text>
              </TouchableOpacity>
            ) : null}
            {onOpenTerms ? (
              <TouchableOpacity onPress={onOpenTerms}>
                <Text style={styles.link}>Terms of service</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.btn} onPress={onAccept} activeOpacity={0.85}>
            <Text style={styles.btnTxt}>I understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0f1d35",
    borderRadius: 18,
    padding: 22,
    gap: 14
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  body: { color: "#cbd5e1", fontSize: 14, lineHeight: 20 },
  linkRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  link: { color: "#60a5fa", fontWeight: "700" },
  btn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6
  },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 }
});
