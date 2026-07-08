import { createElement } from "react";
import { FirestoreCatalogScreen } from "../../components/FirestoreCatalogScreen";

export default function PerfumariaScreen() {
  return createElement(FirestoreCatalogScreen, {
    title: "Perfumaria",
    subtitle: "Cuidados e beleza para o dia a dia",
    productDescription: "Cuidado e beleza para a sua rotina",
    categoria: "perfumaria",
  });
}
