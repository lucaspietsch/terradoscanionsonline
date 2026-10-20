export interface ViaCepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Autopreenchimento de endereço via ViaCEP. Retorna null se o CEP não existir ou a consulta falhar. */
export async function fetchCep(cep: string): Promise<ViaCepResult | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const d = await res.json();
    if (d.erro) return null;
    return { street: d.logradouro ?? "", neighborhood: d.bairro ?? "", city: d.localidade ?? "", state: d.uf ?? "" };
  } catch {
    return null;
  }
}
