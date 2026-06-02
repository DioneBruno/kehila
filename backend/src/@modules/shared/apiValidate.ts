export class ApiValidate {
  static validateCpfCnpj(input: string): boolean {
    if (this.validateCpf(input)) return true;
    if (this.validateCnpj(input)) return true;
    return false;
  }
  static validateCpf(cpf: string) {
    // Remove qualquer coisa que não seja dígito
    cpf = cpf.replace(/\D/g, "");

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Elimina CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(cpf[i]) * (10 - i);
    }
    let firstVerifier = (sum * 10) % 11;
    if (firstVerifier === 10) firstVerifier = 0;

    // Verifica se o primeiro dígito está correto
    if (Number(cpf[9]) !== firstVerifier) return false;

    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cpf[i]) * (11 - i);
    }
    let secondVerifier = (sum * 10) % 11;
    if (secondVerifier === 10) secondVerifier = 0;

    // Verifica se o segundo dígito está correto
    return Number(cpf[10]) === secondVerifier;
  }
  static validateCnpj(cnpj: string) {
    // Remove tudo que não é dígito
    cnpj = cnpj.replace(/\D/g, "");

    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;

    // Elimina CNPJs com todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    // Multiplicadores pros dígitos verificadores
    const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Number(cnpj[i]) * firstWeights[i];
    }
    let firstVerifier = sum % 11;
    firstVerifier = firstVerifier < 2 ? 0 : 11 - firstVerifier;

    // Verifica o primeiro dígito
    if (Number(cnpj[12]) !== firstVerifier) return false;

    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += Number(cnpj[i]) * secondWeights[i];
    }
    let secondVerifier = sum % 11;
    secondVerifier = secondVerifier < 2 ? 0 : 11 - secondVerifier;

    // Verifica o segundo dígito
    return Number(cnpj[13]) === secondVerifier;
  }
  static validateEmail(email: string): string | boolean {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      )
      ? email
      : false;
  }
  static validateCep(cep: string): boolean {
    const cepRegex = /^[0-9]{5}-?[0-9]{3}$/;
    return cepRegex.test(cep);
  }
  static validateAgeDate(dateOfBirthString: string, minimumAge = 0): boolean {
    const actualDate = new Date();
    const dateOfBirth = new Date(dateOfBirthString);

    if (isNaN(dateOfBirth.getTime())) {
      return false;
    }
    const minYear = 1920;
    const actualYear = actualDate.getFullYear();
    const maxYear = actualYear;

    const minDate = new Date(minYear, 0, 1);
    const maxDate = new Date(maxYear, 11, 31);

    if (dateOfBirth < minDate || dateOfBirth > maxDate) {
      return false;
    }

    const idade = actualYear - dateOfBirth.getFullYear();

    if (idade < minimumAge) {
      return false;
    }
    return true;
  }
  static validatePersonName(name: string) {
    name = name.replace(/[^\p{L}\p{N} ]+/gu, "");
    const regex = /^[a-zA-ZÀ-ÿ]+(?: [a-zA-ZÀ-ÿ]+)+$/;
    return regex.test(name);
  }
}
