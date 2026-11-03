"""Decifra users.full_name / email / cpf (porta de _parseStr em js/src/app.js).

A chave vem da variavel de ambiente WARD_NOME_CHAVE (ver README.md,
"Nomes cifrados"). Texto que nao parece cifrado volta como esta.
"""
import base64
import os
import re


def decifrar_nome(valor, chave=None):
    chave = chave if chave is not None else os.environ.get('WARD_NOME_CHAVE', '')
    if not isinstance(valor, str) or not chave:
        return valor
    if len(valor) < 8 or not re.fullmatch(r'[A-Za-z0-9+/]+=*', valor):
        return valor
    if '@' in valor or '.' in valor or re.fullmatch(r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}', valor):
        return valor
    try:
        d = base64.b64decode(valor).decode('utf-8')
        r = ''.join(chr(ord(c) ^ ord(chave[i % len(chave)])) for i, c in enumerate(d))
        return r if re.fullmatch(r'[\x20-\x7E\xA0-\xFF]+', r) else valor
    except Exception:
        return valor


if __name__ == '__main__':
    import sys
    for v in sys.argv[1:]:
        print(decifrar_nome(v))
