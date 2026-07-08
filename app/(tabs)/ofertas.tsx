import { createElement } from "react";
import { FirestoreCatalogScreen } from "../../components/FirestoreCatalogScreen";

export default function OfertasScreen() {
  return createElement(FirestoreCatalogScreen, {
    title: "Ofertas",
    subtitle: "Encontre os melhores produtos",
    productDescription: "Aproveite nossas melhores ofertas",
    ofertas: true,
  });
}
