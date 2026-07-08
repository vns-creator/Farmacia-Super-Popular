import { createElement } from "react";
import { FirestoreCatalogScreen } from "../../components/FirestoreCatalogScreen";

export default function BabyScreen() {
  return createElement(FirestoreCatalogScreen, {
    title: "Baby",
    subtitle: "Cuidados especiais para o bebe",
    productDescription: "Cuidado delicado para os pequenos",
    categoria: "baby",
  });
}
