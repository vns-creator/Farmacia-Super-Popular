import { type CategoriaProduto } from "../services/products";

export type ProdutoInicial = {
  nome: string;
  categoria: CategoriaProduto;
  preco: number;
  descricao: string;
  emOferta?: boolean;
  destaque?: boolean;
};

export const produtosIniciais: ProdutoInicial[] = [
  {
    nome: "Dipirona 1g",
    categoria: "ofertas",
    preco: 12.9,
    descricao: "Medicamento para dor e febre",
    emOferta: true,
    destaque: true,
  },
  {
    nome: "Paracetamol 750mg",
    categoria: "ofertas",
    preco: 9.9,
    descricao: "Medicamento para dor e febre",
    emOferta: true,
  },
  {
    nome: "Vitamina C",
    categoria: "ofertas",
    preco: 19.9,
    descricao: "Suplemento vitaminico",
    emOferta: true,
    destaque: true,
  },
  {
    nome: "Melatonina 3mg",
    categoria: "manipulados",
    preco: 39.9,
    descricao: "Formula preparada com cuidado",
    destaque: true,
  },
  {
    nome: "Biotina 5mg",
    categoria: "manipulados",
    preco: 42.9,
    descricao: "Formula manipulada",
  },
  {
    nome: "Omega 3 Manipulado",
    categoria: "manipulados",
    preco: 46.9,
    descricao: "Formula manipulada",
  },
  {
    nome: "Shampoo Anticaspa",
    categoria: "perfumaria",
    preco: 24.9,
    descricao: "Cuidado para o cabelo",
    emOferta: true,
  },
  {
    nome: "Protetor Solar",
    categoria: "perfumaria",
    preco: 32.9,
    descricao: "Protecao para o dia a dia",
    destaque: true,
  },
  {
    nome: "Creme Corporal",
    categoria: "perfumaria",
    preco: 23.9,
    descricao: "Hidratacao para a pele",
  },
  {
    nome: "Sabonete Liquido",
    categoria: "higiene",
    preco: 14.9,
    descricao: "Essencial para higiene diaria",
    emOferta: true,
  },
  {
    nome: "Creme Dental",
    categoria: "higiene",
    preco: 8.9,
    descricao: "Cuidado bucal",
    emOferta: true,
  },
  {
    nome: "Alcool em Gel",
    categoria: "higiene",
    preco: 10.9,
    descricao: "Higienizacao das maos",
  },
  {
    nome: "Fralda Baby",
    categoria: "baby",
    preco: 39.9,
    descricao: "Cuidado para os pequenos",
    emOferta: true,
    destaque: true,
  },
  {
    nome: "Lenco Umedecido",
    categoria: "baby",
    preco: 11.9,
    descricao: "Higiene delicada",
    emOferta: true,
  },
  {
    nome: "Mamadeira",
    categoria: "baby",
    preco: 26.9,
    descricao: "Produto infantil",
  },
];
