import {
  createLoan as storeCreateLoan,
  deleteLoan as storeDeleteLoan,
  listLoans,
  recordLoanPayment as storeLoanPayment,
  updateLoan as storeUpdateLoan,
  payoffMonthsEstimate,
  type LoanStored,
} from "@/lib/finance-store";
import type { Loan, LoanDirection } from "@utils/types";

function mapLoan(r: LoanStored): Loan {
  return {
    id: r.id,
    name: r.name,
    principalAmount: r.principalAmount,
    remainingBalance: r.remainingBalance,
    interestRate: r.interestRate,
    emiAmount: r.emiAmount,
    nextDueDate: r.nextDueDate,
    lenderName: r.lenderName,
    type: r.type,
    createdAt: r.createdAt,
  };
}

export type CreateLoanPayload = {
  name: string;
  principalAmount: number;
  remainingBalance: number;
  interestRate: number;
  emiAmount: number;
  nextDueDate: string;
  lenderName: string;
  type: LoanDirection;
};

export const fetchLoans = async (): Promise<{ data: { loans: Loan[] } }> => ({
  data: { loans: listLoans().map(mapLoan) },
});

export const createLoan = async (payload: CreateLoanPayload): Promise<{ data: { loan: Loan } }> => {
  const row = storeCreateLoan({
    name: payload.name,
    principalAmount: payload.principalAmount,
    remainingBalance: payload.remainingBalance,
    interestRate: payload.interestRate,
    emiAmount: payload.emiAmount,
    nextDueDate: payload.nextDueDate,
    lenderName: payload.lenderName,
    type: payload.type,
  });
  return { data: { loan: mapLoan(row) } };
};

export const updateLoan = async (
  id: string,
  patch: Partial<CreateLoanPayload>
): Promise<{ data: { loan: Loan } }> => {
  const row = storeUpdateLoan(id, patch);
  if (!row) throw new Error("Loan not found");
  return { data: { loan: mapLoan(row) } };
};

export const deleteLoan = async (id: string): Promise<{ data: { ok: true } }> => {
  storeDeleteLoan(id);
  return { data: { ok: true } };
};

export const payLoan = async (payload: {
  loanId: string;
  walletId: string;
  amount: number;
  date: string;
}): Promise<{ data: { ok: true } }> => {
  storeLoanPayment(payload);
  return { data: { ok: true } };
};

export { payoffMonthsEstimate };
