import { createElement } from "react";
import { FirestoreCatalogScreen } from "../../components/FirestoreCatalogScreen";

export default function ManipuladosScreen() {
  return createElement(FirestoreCatalogScreen, {
    title: "Manipulados",
    subtitle: "Produtos manipulados da farmacia",
    searchPlaceholder: "Buscar manipulados",
    productDescription: "Formulas preparadas com cuidado",
    categoria: "manipulados",
  });
}
