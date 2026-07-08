import { User } from "firebase/auth";
import {
  doc,
  runTransaction,
  serverTimestamp,
  Transaction,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const formatSequentialCode = (
  prefix: string,
  value: number,
  size: number,
) => {
  return `${prefix}-${String(value).padStart(size, "0")}`;
};

const getNextSequence = async (
  transaction: Transaction,
  sequenceName: string,
) => {
  const sequenceRef = doc(db, "sequencias", sequenceName);
  const sequenceDoc = await transaction.get(sequenceRef);
  const currentValue = sequenceDoc.exists()
    ? Number(sequenceDoc.data().valor || 0)
    : 0;
  const nextValue = currentValue + 1;

  transaction.set(
    sequenceRef,
    {
      valor: nextValue,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );

  return nextValue;
};

export const getOrCreateClientCode = async (user: User) => {
  return runTransaction(db, async (transaction) => {
    return getOrCreateClientCodeInTransaction(transaction, user);
  });
};

export const getOrCreateClientCodeInTransaction = async (
  transaction: Transaction,
  user: User,
) => {
  const clientByUidRef = doc(db, "clientesPorUid", user.uid);
  const clientByUidDoc = await transaction.get(clientByUidRef);

  if (clientByUidDoc.exists()) {
    const codigoCliente = clientByUidDoc.data().codigoCliente;

    if (codigoCliente) {
      return String(codigoCliente);
    }
  }

  const nextClientNumber = await getNextSequence(transaction, "clientes");
  const codigoCliente = formatSequentialCode("Cliente", nextClientNumber, 4);
  const clientRef = doc(db, "clientes", codigoCliente);

  transaction.set(
    clientRef,
    {
      codigoCliente,
      uid: user.uid,
      email: user.email,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );

  transaction.set(
    clientByUidRef,
    {
      codigoCliente,
      uid: user.uid,
      email: user.email,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );

  return codigoCliente;
};

export const createOrderCodeInTransaction = async (
  transaction: Transaction,
) => {
  const nextOrderNumber = await getNextSequence(transaction, "pedidos");
  return formatSequentialCode("Pedido", nextOrderNumber, 5);
};
