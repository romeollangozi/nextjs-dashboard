'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greate than 0$' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select one of the options',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    status?: string[];
    amount?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(prevSate: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields failed to create invoce',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES(${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch (err) {
    throw new Error('Database Error: Failed to Create Invoice');
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const EditInvoice = FormSchema.omit({ id: true, date: true });

export async function editInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = EditInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields failed to create invoce',
    };
  }
  const { amount, customerId, status } = validatedFields.data;
  const amountInCents = amount * 100;
  try {
    await sql`
  UPDATE invoices
  SET amount=${amountInCents},
  customer_id=${customerId},
  status=${status}
  WHERE id=${id}`;
  } catch (error) {
    throw new Error('Database Error: Failed to Edit Invoice');
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    sql`
  DELETE FROM invoices
  WHERE id=${id}
  `;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    throw new Error('Database Error: Failed to Delete Invoice');
  }
}

export async function authenticate(prevState: string | undefined, formData: FormData){
  try{
    await signIn('credentials', formData)
  }catch(error){
    if (error instanceof AuthError){
      switch(error.type){
        case 'CredentialsSignin':
          return 'Invalid Credentials';
        default:
          return 'Something went wrong'
      }
    }
    throw error;
  }
}
