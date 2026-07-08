import { createElement } from "react";
import { FirestoreCatalogScreen } from "../../components/FirestoreCatalogScreen";

export default function HigieneScreen() {
  return createElement(FirestoreCatalogScreen, {
    title: "Higiene",
    subtitle: "Itens essenciais de higiene diaria",
    productDescription: "Essencial para sua higiene e cuidado diario",
    categoria: "higiene",
  });
}
