import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarChart from "./components/BarChart";
import type { VendasData } from "./types";

function App() {
  const [vendasData, setVendasData] = useState<VendasData[]>([]);

  useEffect(() => {
    axios
      .get<VendasData[]>("http://127.0.0.1:8000/vendas")
      .then((response) => {
        setVendasData(response.data);
      })
      .catch((error) => {
        console.error("Houve um erro ao buscar os dados:", error);
      });
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Relatório de Vendas por Produto</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center PX-0">
          <BarChart data={vendasData.slice(0, 10)} />
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
