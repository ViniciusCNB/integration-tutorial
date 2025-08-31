# Tutorial: Gráfico de Barras com PostgreSQL, FastAPI e React

Este projeto é um tutorial simplificado que demonstra como criar uma aplicação web completa com um gráfico de barras interativo. Utilizamos um banco de dados PostgreSQL para armazenar os dados, um back-end em FastAPI para fornecer os dados através de uma API e um front-end em React com a biblioteca de componentes Shadcn/ui e D3.js para visualização de dados.

## Visão Geral da Arquitetura

* **Banco de Dados**: PostgreSQL com uma única tabela contendo dados de exemplo.
* **Back-end**: API desenvolvida com FastAPI (Python) para consultar o banco de dados e expor um endpoint.
* **Front-end**: Aplicação em React (Vite) que consome a API do back-end e renderiza um gráfico de barras usando D3.js dentro de um componente de Card do Shadcn/ui.

---

## Começando

Siga os passos abaixo para configurar e rodar o projeto em sua máquina local.

### 1. Pré-requisitos

* [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
* [Python](https://www.python.org/downloads/) (versão 3.8 ou superior)
* [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando.
* [Git](https://git-scm.com/) (opcional, para clonar o repositório)

---

### 2. Configuração do Banco de Dados (PostgreSQL)

Primeiro, precisamos criar nosso banco de dados e a tabela que irá armazenar os dados.

1.  **Crie um Banco de Dados**:
    Use o `psql` ou uma ferramenta de sua preferência (DBeaver, pgAdmin) para criar um novo banco de dados.

    ```sql
    CREATE DATABASE tutorial_db;
    ```

2.  **Crie a Tabela**:
    Conecte-se ao banco de dados recém-criado e execute o seguinte comando para criar a tabela `vendas_produto`.

    ```sql
    CREATE TABLE vendas_produto (
        id SERIAL PRIMARY KEY,
        produto VARCHAR(100) NOT NULL,
        vendas INTEGER NOT NULL
    );
    ```

3.  **Insira os Dados de Exemplo**:
    Agora, popule a tabela com cerca de 50 registros. Aqui estão alguns exemplos:

    ```sql
    INSERT INTO vendas_produto (produto, vendas) VALUES
    ('Produto A', 150),
    ('Produto B', 200),
    ('Produto C', 120),
    ('Produto D', 300),
    ('Produto E', 250);
    -- Continue inserindo mais dados até ter ~50 registros
    ```

---

### 3. Configuração do Back-end (FastAPI)

O back-end é responsável por se conectar ao banco de dados e expor os dados através de uma API REST.

1.  **Clone o repositório e navegue até a pasta `back`**:
    ```bash
    git clone <url-do-seu-repositorio>
    cd <nome-do-repositorio>/back
    ```

2.  **Crie um Ambiente Virtual e Instale as Dependências**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # No Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```
    O arquivo `requirements.txt` deve conter:
    ```
    fastapi
    uvicorn[standard]
    psycopg2-binary
    pydantic
    python-dotenv
    ```

3.  **Configure as Variáveis de Ambiente**:
    Crie um arquivo `.env` na pasta `back` com as credenciais do seu banco de dados:
    ```
    DATABASE_URL="postgresql://USUARIO:SENHA@localhost/tutorial_db"
    ```

4.  **Estrutura do Código (`main.py`)**:
    Este é o código principal do nosso back-end.

    ```python
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import os
    from dotenv import load_dotenv
    from fastapi.middleware.cors import CORSMiddleware

    load_dotenv()

    app = FastAPI()

    # Configuração do CORS
    origins = [
        "http://localhost:5173", # Endereço do front-end em React
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


    # Schema da Resposta com Pydantic
    class Vendas(BaseModel):
        produto: str
        vendas: int

    def get_db_connection():
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        return conn

    @app.get("/vendas", response_model=list[Vendas])
    def get_vendas():
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Consulta SQL para buscar os dados
            cursor.execute("SELECT produto, vendas FROM vendas_produto ORDER BY vendas DESC")
            
            vendas = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return vendas
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    ```

5.  **Rode o Servidor Back-end**:
    ```bash
    uvicorn main:app --reload
    ```
    Acesse `http://127.0.0.1:8000/docs` para ver a documentação da API.

---

### 4. Configuração do Front-end (React + Shadcn + D3)

O front-end irá consumir os dados da nossa API e exibi-los em um gráfico.

1.  **Navegue até a pasta `front` e instale as dependências**:
    ```bash
    cd ../front
    npm install
    ```
    As principais dependências no `package.json` são:
    ```json
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "d3": "^7.8.5",
      "axios": "^1.6.0",
      "lucide-react": "^0.300.0",
      "class-variance-authority": "^0.7.0",
      "clsx": "^2.0.0",
      "tailwind-merge": "^2.2.0",
      "tailwindcss-animate": "^1.0.7"
    }
    ```

2.  **Estrutura do Componente do Gráfico**:
    Vamos criar um componente `BarChart.jsx` para encapsular a lógica do D3.js e um componente principal `App.jsx` que busca os dados e renderiza o gráfico dentro de um Card do Shadcn.

    **Componente `BarChart.jsx` (Lógica do D3)**
    ```jsx
    // src/components/BarChart.jsx
    import React, { useRef, useEffect } from 'react';
    import * as d3 from 'd3';

    const BarChart = ({ data }) => {
      const svgRef = useRef();

      useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Limpa o SVG anterior

        const width = 500;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 90 };

        svg.attr('width', width).attr('height', height);

        const x = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.vendas)])
          .range([margin.left, width - margin.right]);

        const y = d3.scaleBand()
          .domain(data.map(d => d.produto))
          .range([margin.top, height - margin.bottom])
          .padding(0.1);

        // Barras
        svg.append("g")
          .attr("fill", "steelblue")
          .selectAll("rect")
          .data(data)
          .join("rect")
            .attr("x", x(0))
            .attr("y", d => y(d.produto))
            .attr("width", d => x(d.vendas) - x(0))
            .attr("height", y.bandwidth());

        // Eixo Y
        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));

        // Eixo X
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(width / 80));

      }, [data]);

      return <svg ref={svgRef}></svg>;
    };

    export default BarChart;
    ```

    **Componente Principal `App.jsx`**
    ```jsx
    // src/App.jsx
    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import BarChart from './components/BarChart';
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


    function App() {
      const [vendasData, setVendasData] = useState([]);

      useEffect(() => {
        // Busca os dados do back-end
        axios.get('[http://127.0.0.1:8000/vendas](http://127.0.0.1:8000/vendas)')
          .then(response => {
            setVendasData(response.data);
          })
          .catch(error => {
            console.error("Houve um erro ao buscar os dados:", error);
          });
      }, []);

      return (
        <div className="container mx-auto p-8">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Relatório de Vendas por Produto</CardTitle>
            </CardHeader>
            <CardContent>
              {vendasData.length > 0 ? (
                <BarChart data={vendasData} />
              ) : (
                <p>Carregando dados...</p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    export default App;
    ```

3.  **Rode a Aplicação Front-end**:
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:5173` em seu navegador para ver o resultado.