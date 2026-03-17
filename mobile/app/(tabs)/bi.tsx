import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { G, Path } from 'react-native-svg';
import { RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';
import { MetodoPagamento } from '../../src/store/slices/businessSlice';
import { enqueueSyncItem } from '../../src/store/slices/syncQueueSlice';
import { formatCurrencyBRL } from '../../src/utils/formatters';
import { ui } from '../../src/ui/ui';

function monthKey(isoDate: string) {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(count: number): string[] {
  const base = new Date();
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-');
  return `${month}/${year.slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, item) => acc + item, 0) / values.length;
}

function sampleStd(values: number[]) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function linearRegression(points: { x: number; y: number }[]) {
  if (points.length < 2) {
    const avg = points.length ? points[0].y : 0;
    return { slope: 0, intercept: avg };
  }
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n };
  }
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function PieChart({
  data,
  size,
}: {
  data: { label: string; value: number; color: string }[];
  size: number;
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total <= 0) {
    return (
      <View style={[styles.piePlaceholder, { width: size, height: size }]}>
        <Text style={styles.small}>Sem dados</Text>
      </View>
    );
  }

  let startAngle = 0;
  return (
    <Svg width={size} height={size}>
      <G>
        {data.map((slice) => {
          const angle = (slice.value / total) * 360;
          const endAngle = startAngle + angle;
          const path = describeArc(size / 2, size / 2, size / 2, startAngle, endAngle);
          const currentStart = startAngle;
          startAngle = endAngle;
          return <Path key={`${slice.label}-${currentStart}`} d={path} fill={slice.color} />;
        })}
      </G>
    </Svg>
  );
}

export default function BI() {
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeUserId = useSelector((state: RootState) => state.session.activeUserId);
  const vendas = useSelector((state: RootState) =>
    state.business.vendas.filter((item) => item.usuario_id === activeUserId)
  );
  const gastos = useSelector((state: RootState) =>
    state.business.gastosExtras.filter((item) => item.usuario_id === activeUserId)
  );
  const produtos = useSelector((state: RootState) =>
    state.referenceData.produtos.filter((item) => item.usuario_id === activeUserId)
  );
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  const mesAtual = monthKey(new Date().toISOString());

  const vendasMes = useMemo(
    () => vendas.filter((item) => monthKey(item.data_venda) === mesAtual),
    [vendas, mesAtual]
  );
  const gastosMes = useMemo(
    () => gastos.filter((item) => monthKey(item.data_gasto) === mesAtual),
    [gastos, mesAtual]
  );

  const faturamento = useMemo(
    () => vendasMes.reduce((acc, item) => acc + item.total_liquido, 0),
    [vendasMes]
  );
  const totalGastos = useMemo(
    () => gastosMes.reduce((acc, item) => acc + item.valor, 0),
    [gastosMes]
  );
  const lucro = useMemo(() => faturamento - totalGastos, [faturamento, totalGastos]);
  const ticketMedio = useMemo(
    () => (vendasMes.length ? faturamento / vendasMes.length : 0),
    [faturamento, vendasMes]
  );

  const produtosById = useMemo(() => {
    const map: Record<number, { nome: string; custo: number; estoque: number }> = {};
    produtos.forEach((item) => {
      map[item.id] = {
        nome: item.nome,
        custo: item.preco_custo ?? 0,
        estoque: item.quantidade_estoque ?? 0,
      };
    });
    return map;
  }, [produtos]);

  const produtosMaisVendidos = useMemo(() => {
    const mapa: Record<string, number> = {};
    vendasMes.forEach((venda) => {
      venda.itens.forEach((item) => {
        mapa[item.nome_produto] = (mapa[item.nome_produto] ?? 0) + item.quantidade;
      });
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [vendasMes]);

  const lucroPorProduto = useMemo(() => {
    const mapa: Record<number, { nome: string; receita: number; custo: number; lucro: number; qtd: number }> = {};
    vendasMes.forEach((venda) => {
      venda.itens.forEach((item) => {
        const produto = produtosById[item.produto_id];
        const nome = produto?.nome ?? item.nome_produto;
        const custoUnit = produto?.custo ?? 0;
        const receita = item.subtotal ?? item.preco_unitario * item.quantidade;
        const custo = custoUnit * item.quantidade;
        if (!mapa[item.produto_id]) {
          mapa[item.produto_id] = { nome, receita: 0, custo: 0, lucro: 0, qtd: 0 };
        }
        mapa[item.produto_id].receita += receita;
        mapa[item.produto_id].custo += custo;
        mapa[item.produto_id].lucro += receita - custo;
        mapa[item.produto_id].qtd += item.quantidade;
      });
    });
    return Object.values(mapa).sort((a, b) => b.lucro - a.lucro);
  }, [vendasMes, produtosById]);

  const monthlySeries = useMemo(() => {
    const keys = lastMonths(6);
    return keys.map((key) => {
      const vendasValue = vendas
        .filter((item) => monthKey(item.data_venda) === key)
        .reduce((acc, item) => acc + item.total_liquido, 0);
      const gastosValue = gastos
        .filter((item) => monthKey(item.data_gasto) === key)
        .reduce((acc, item) => acc + item.valor, 0);
      const saldo = vendasValue - gastosValue;
      return { key, label: monthLabel(key), vendas: vendasValue, gastos: gastosValue, saldo };
    });
  }, [gastos, vendas]);

  const maxChartValue = useMemo(() => {
    const maxVendas = Math.max(...monthlySeries.map((item) => item.vendas), 0);
    const maxGastos = Math.max(...monthlySeries.map((item) => item.gastos), 0);
    return Math.max(maxVendas, maxGastos, 1);
  }, [monthlySeries]);

  const lucroMax = useMemo(() => {
    const maxValue = Math.max(...lucroPorProduto.map((item) => item.lucro), 0);
    return Math.max(maxValue, 1);
  }, [lucroPorProduto]);

  const previsaoCompras = useMemo(() => {
    const keys = lastMonths(6);
    const monthsIndex: Record<string, number> = {};
    keys.forEach((key, index) => {
      monthsIndex[key] = index;
    });

    const porProduto: Record<number, number[]> = {};
    vendas.forEach((venda) => {
      const key = monthKey(venda.data_venda);
      const idx = monthsIndex[key];
      if (idx === undefined) return;

      venda.itens.forEach((item) => {
        if (!porProduto[item.produto_id]) {
          porProduto[item.produto_id] = Array(keys.length).fill(0);
        }
        porProduto[item.produto_id][idx] += item.quantidade;
      });
    });

    return Object.entries(porProduto)
      .map(([idStr, serie]) => {
        const id = Number(idStr);
        const points = serie.map((y, x) => ({ x, y }));
        const { slope, intercept } = linearRegression(points);
        const predicted = Math.max(0, slope * serie.length + intercept);
        const info = produtosById[id];
        const estoqueAtual = info?.estoque ?? 0;
        const sugestao = Math.max(0, Math.round(predicted - estoqueAtual));
        const risco = predicted > 0 ? clamp((predicted - estoqueAtual) / predicted, 0, 1) : 0;
        return {
          id,
          nome: info?.nome ?? `Produto ${id}`,
          predicted,
          estoqueAtual,
          sugestao,
          risco,
        };
      })
      .sort((a, b) => b.sugestao - a.sugestao)
      .slice(0, 6);
  }, [vendas, produtosById]);

  const metodoProbabilidades = useMemo(() => {
    const mapa: Record<MetodoPagamento, number> = {
      pix: 0,
      dinheiro: 0,
      cartao: 0,
      transferencia: 0,
    };
    vendasMes.forEach((venda) => {
      mapa[venda.metodo_pagamento] += 1;
    });
    const total = Object.values(mapa).reduce((acc, v) => acc + v, 0) || 1;
    const cores: Record<MetodoPagamento, string> = {
      pix: '#2e7d32',
      dinheiro: '#f9a825',
      cartao: '#1565c0',
      transferencia: '#6d4c41',
    };
    return (Object.keys(mapa) as MetodoPagamento[]).map((key) => ({
      label: key,
      value: mapa[key],
      percent: (mapa[key] / total) * 100,
      color: cores[key],
    }));
  }, [vendasMes]);

  const distribuicaoItens = useMemo(() => {
    const buckets = [1, 2, 3, 4, 5];
    const counts = [0, 0, 0, 0, 0];
    vendasMes.forEach((venda) => {
      const qtd = venda.itens.reduce((acc, item) => acc + item.quantidade, 0);
      if (qtd <= 1) counts[0] += 1;
      else if (qtd === 2) counts[1] += 1;
      else if (qtd === 3) counts[2] += 1;
      else if (qtd === 4) counts[3] += 1;
      else counts[4] += 1;
    });
    const total = counts.reduce((acc, v) => acc + v, 0) || 1;
    return buckets.map((bucket, index) => ({
      label: bucket === 5 ? '5+' : bucket.toString(),
      value: counts[index],
      percent: (counts[index] / total) * 100,
    }));
  }, [vendasMes]);

  const distribuicaoTickets = useMemo(() => {
    const ranges = [0, 20, 50, 100, 999999];
    const labels = ['0-20', '20-50', '50-100', '100+'];
    const counts = [0, 0, 0, 0];
    vendasMes.forEach((venda) => {
      const value = venda.total_liquido;
      for (let i = 0; i < ranges.length - 1; i += 1) {
        if (value >= ranges[i] && value < ranges[i + 1]) {
          counts[i] += 1;
          break;
        }
      }
    });
    const total = counts.reduce((acc, v) => acc + v, 0) || 1;
    return labels.map((label, index) => ({
      label,
      value: counts[index],
      percent: (counts[index] / total) * 100,
    }));
  }, [vendasMes]);

  const hipoteses = useMemo(() => {
    const sales = monthlySeries.map((item) => item.vendas);
    if (sales.length < 6) {
      return { status: 'Amostra insuficiente', t: 0, meanA: 0, meanB: 0 };
    }
    const grupoA = sales.slice(0, 3);
    const grupoB = sales.slice(3, 6);
    const meanA = mean(grupoA);
    const meanB = mean(grupoB);
    const s1 = sampleStd(grupoA);
    const s2 = sampleStd(grupoB);
    const n1 = grupoA.length;
    const n2 = grupoB.length;
    const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
    const t = sp === 0 ? 0 : (meanB - meanA) / (sp * Math.sqrt(1 / n1 + 1 / n2));
    const critico = 2.78;
    const status = Math.abs(t) > critico ? 'Rejeita H0 (mudanca significativa)' : 'Nao rejeita H0';
    return { status, t, meanA, meanB };
  }, [monthlySeries]);

  async function gerarRelatorioPdf() {
    try {
      const linhasLucro = lucroPorProduto.slice(0, 10).map((item) => `
        <tr>
          <td>${item.nome}</td>
          <td style="text-align:right">${item.qtd}</td>
          <td style="text-align:right">${formatCurrencyBRL(item.receita)}</td>
          <td style="text-align:right">${formatCurrencyBRL(item.custo)}</td>
          <td style="text-align:right">${formatCurrencyBRL(item.lucro)}</td>
        </tr>
      `).join('');

      const linhasPrevisao = previsaoCompras.map((item) => `
        <tr>
          <td>${item.nome}</td>
          <td style="text-align:right">${item.predicted.toFixed(1)}</td>
          <td style="text-align:right">${item.estoqueAtual}</td>
          <td style="text-align:right">${item.sugestao}</td>
          <td style="text-align:right">${(item.risco * 100).toFixed(0)}%</td>
        </tr>
      `).join('');

      const linhasProb = metodoProbabilidades.map((item) => `
        <tr>
          <td>${item.label}</td>
          <td style="text-align:right">${item.value}</td>
          <td style="text-align:right">${item.percent.toFixed(1)}%</td>
        </tr>
      `).join('');

      const linhasDiscretas = distribuicaoItens.map((item) => `
        <tr>
          <td>${item.label} itens</td>
          <td style="text-align:right">${item.value}</td>
          <td style="text-align:right">${item.percent.toFixed(1)}%</td>
        </tr>
      `).join('');

      const linhasContinuas = distribuicaoTickets.map((item) => `
        <tr>
          <td>${item.label}</td>
          <td style="text-align:right">${item.value}</td>
          <td style="text-align:right">${item.percent.toFixed(1)}%</td>
        </tr>
      `).join('');

      const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
            .metric { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>Relatorio BI - SweetControl</h1>
          <div class="metric">Mes atual: ${mesAtual}</div>
          <div class="metric">Faturamento: ${formatCurrencyBRL(faturamento)}</div>
          <div class="metric">Gastos: ${formatCurrencyBRL(totalGastos)}</div>
          <div class="metric">Lucro: ${formatCurrencyBRL(lucro)}</div>
          <div class="metric">Ticket medio: ${formatCurrencyBRL(ticketMedio)}</div>

          <h2>Lucro real por produto</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Receita</th>
                <th>Custo</th>
                <th>Lucro</th>
              </tr>
            </thead>
            <tbody>${linhasLucro || '<tr><td colspan="5">Sem dados</td></tr>'}</tbody>
          </table>

          <h2>Previsao de compras</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Previsto</th>
                <th>Estoque</th>
                <th>Sugestao</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>${linhasPrevisao || '<tr><td colspan="5">Sem dados</td></tr>'}</tbody>
          </table>

          <h2>Probabilidades (metodo de pagamento)</h2>
          <table>
            <thead>
              <tr>
                <th>Metodo</th>
                <th>Qtd</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>${linhasProb || '<tr><td colspan="3">Sem dados</td></tr>'}</tbody>
          </table>

          <h2>Variaveis aleatorias discretas</h2>
          <table>
            <thead>
              <tr>
                <th>Itens por venda</th>
                <th>Qtd</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>${linhasDiscretas || '<tr><td colspan="3">Sem dados</td></tr>'}</tbody>
          </table>

          <h2>Variaveis aleatorias continuas</h2>
          <table>
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Qtd</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>${linhasContinuas || '<tr><td colspan="3">Sem dados</td></tr>'}</tbody>
          </table>

          <h2>Teste de hipotese</h2>
          <div class="metric">H0: medias mensais iguais (ultimos 3 vs 3 anteriores)</div>
          <div class="metric">t = ${hipoteses.t.toFixed(2)} | ${hipoteses.status}</div>
          <div class="metric">Media recente: ${formatCurrencyBRL(hipoteses.meanB)} | Media anterior: ${formatCurrencyBRL(hipoteses.meanA)}</div>
        </body>
      </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Relatorio', 'PDF gerado, mas o compartilhamento nao esta disponivel neste dispositivo.');
      }
    } catch (_error) {
      Alert.alert('Relatorio', 'Falha ao gerar o PDF.');
    }
  }

  return (
    <ScrollView style={[ui.screen, { backgroundColor: activeTheme.background }]}>
      <Text style={[ui.title, { color: activeTheme.text }]}>BI & Financeiro</Text>
      <Text style={styles.subtitle}>Mes atual: {mesAtual}</Text>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.metric}>Faturamento: {formatCurrencyBRL(faturamento)}</Text>
        <Text style={styles.metric}>Gastos: {formatCurrencyBRL(totalGastos)}</Text>
        <Text style={styles.metric}>Lucro: {formatCurrencyBRL(lucro)}</Text>
        <Text style={styles.metric}>Ticket medio: {formatCurrencyBRL(ticketMedio)}</Text>
      </View>

      <TouchableOpacity
        style={[ui.primaryBtn, styles.reportButton, { backgroundColor: activeTheme.primary }]}
        onPress={gerarRelatorioPdf}
      >
        <Text style={ui.primaryText}>Gerar relatorio em PDF</Text>
      </TouchableOpacity>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Analise de Dados Quantitativos</Text>
        <Text style={styles.small}>Oscilacao Mensal (Vendas x Gastos)</Text>
        <View style={styles.chartRow}>
          {monthlySeries.map((item, index) => {
            const prev = index > 0 ? monthlySeries[index - 1].saldo : item.saldo;
            const trend = item.saldo > prev ? 'up' : item.saldo < prev ? 'down' : 'same';
            return (
              <View key={item.key} style={styles.chartCol}>
                <View style={styles.barsWrap}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((item.vendas / maxChartValue) * 100, 2)}%`,
                        backgroundColor: '#1e88e5',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((item.gastos / maxChartValue) * 100, 2)}%`,
                        backgroundColor: '#e53935',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartSaldo}>
                  {trend === 'up' ? '^' : trend === 'down' ? 'v' : '-'} {formatCurrencyBRL(item.saldo)}
                </Text>
                <Text style={styles.chartLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1e88e5' }]} />
            <Text style={styles.small}>Vendas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e53935' }]} />
            <Text style={styles.small}>Gastos</Text>
          </View>
        </View>
      </View>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Lucro real por produto</Text>
        {lucroPorProduto.length === 0 ? (
          <Text style={styles.small}>Sem vendas no mes.</Text>
        ) : (
          lucroPorProduto.slice(0, 6).map((item) => (
            <View key={item.nome} style={styles.barRow}>
              <View style={styles.barLabelWrap}>
                <Text style={styles.small}>{item.nome}</Text>
                <Text style={styles.small}>Qtd {item.qtd}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(Math.abs(item.lucro) / lucroMax) * 100}%`,
                      backgroundColor: item.lucro >= 0 ? '#2e7d32' : '#c62828',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{formatCurrencyBRL(item.lucro)}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.section}>Produtos mais vendidos</Text>
      {produtosMaisVendidos.length === 0 ? (
        <Text style={styles.small}>Sem vendas no mes.</Text>
      ) : (
        produtosMaisVendidos.map((item) => (
          <View key={item[0]} style={[ui.listCard, styles.rankCard, { backgroundColor: activeTheme.card }]}>
            <Text style={{ color: activeTheme.text }}>{item[0]}</Text>
            <Text style={styles.small}>Qtd: {item[1]}</Text>
          </View>
        ))
      )}

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Modelo Basico de Regressao Linear</Text>
        <Text style={styles.small}>Previsao simples de compras (proximo mes)</Text>
        {previsaoCompras.length === 0 ? (
          <Text style={styles.small}>Sem dados suficientes para previsao.</Text>
        ) : (
          previsaoCompras.map((item) => (
            <View key={item.id} style={styles.predictRow}>
              <View style={styles.predictInfo}>
                <Text style={styles.small}>{item.nome}</Text>
                <Text style={styles.small}>Previsto: {item.predicted.toFixed(1)}</Text>
                <Text style={styles.small}>Estoque: {item.estoqueAtual}</Text>
              </View>
              <View style={styles.predictBadge}>
                <Text style={styles.badgeText}>Sugestao compra: {item.sugestao}</Text>
                <Text style={styles.badgeText}>Risco falta: {(item.risco * 100).toFixed(0)}%</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Probabilidades (metodo de pagamento)</Text>
        <View style={styles.pieRow}>
          <PieChart
            size={140}
            data={metodoProbabilidades.map((item) => ({
              label: item.label,
              value: item.value,
              color: item.color,
            }))}
          />
          <View style={styles.pieLegend}>
            {metodoProbabilidades.map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.small}> {item.label}: {item.percent.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Variaveis Aleatorias Discretas</Text>
        {distribuicaoItens.map((item) => (
          <View key={item.label} style={styles.barRow}>
            <View style={styles.barLabelWrap}>
              <Text style={styles.small}>{item.label} itens</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${item.percent}%`, backgroundColor: '#1565c0' },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{item.percent.toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Variaveis Aleatorias Continuas</Text>
        {distribuicaoTickets.map((item) => (
          <View key={item.label} style={styles.barRow}>
            <View style={styles.barLabelWrap}>
              <Text style={styles.small}>{item.label}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${item.percent}%`, backgroundColor: '#6d4c41' },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{item.percent.toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      <View style={[ui.card, styles.metricsCard, { backgroundColor: activeTheme.card }]}>
        <Text style={styles.section}>Testes de Hipotese</Text>
        <Text style={styles.small}>H0: medias mensais iguais (ultimos 3 vs 3 anteriores)</Text>
        <Text style={styles.small}>t = {hipoteses.t.toFixed(2)} | {hipoteses.status}</Text>
        <Text style={styles.small}>
          Media recente: {formatCurrencyBRL(hipoteses.meanB)} | Media anterior: {formatCurrencyBRL(hipoteses.meanA)}
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleSpacer: { marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 8 },
  metricsCard: { marginBottom: 10 },
  metric: { color: '#333', fontWeight: '700', marginBottom: 4 },
  reportButton: { marginBottom: 12 },
  section: { marginTop: 8, marginBottom: 6, fontWeight: '700', color: '#444' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { width: '15%', alignItems: 'center' },
  barsWrap: {
    width: '100%',
    height: 90,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: { width: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  chartSaldo: { fontSize: 10, color: '#444', marginTop: 3, textAlign: 'center' },
  legendRow: { flexDirection: 'row', marginTop: 10, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  rankCard: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 6 },
  button: { marginTop: 8, borderRadius: 10, padding: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  small: { color: '#666' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabelWrap: { width: 110 },
  barTrack: { flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden', marginRight: 8 },
  barFill: { height: '100%', borderRadius: 8 },
  barValue: { width: 90, textAlign: 'right', color: '#444', fontSize: 12 },
  predictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  predictInfo: { flex: 1 },
  predictBadge: { alignItems: 'flex-end' },
  badgeText: { fontSize: 12, color: '#444' },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pieLegend: { flex: 1 },
  piePlaceholder: { alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#f0f0f0' },
});




