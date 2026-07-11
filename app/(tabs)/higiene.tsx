import { createElement } from "react";
import { FirestoreCatalogScreen } from "../../components/FirestoreCatalogScreen";

export default function HigieneScreen() {
  return createElement(FirestoreCatalogScreen, {
    title: "Higiene",
    subtitle: "Itens essenciais de higiene diária",
    productDescription: "Essencial para sua higiene e cuidado diário",
    categoria: "higiene",
  });
}
