import matplotlib.pyplot as plt
import numpy as np

# ============================================================
# РИСУНОК 4.1 — Времена обработки одиночных бланков (ЭКСП-1)
# ============================================================
ts = [197.52, 160.88, 160.35, 160.28, 159.12, 158.58, 161.98]
n1 = list(range(1, len(ts) + 1))
mean_stable = np.mean(ts[1:])

fig, ax = plt.subplots(figsize=(8, 4.5))
ax.bar(n1, ts, color=['#d9534f'] + ['#5cb85c'] * 6, edgecolor='black')
ax.axhline(mean_stable, color='blue', linestyle='--', linewidth=1.5,
           label=f'Среднее (без 1-го): {mean_stable:.1f} с')
ax.set_xlabel('Номер бланка')
ax.set_ylabel('Время обработки $T_s$, с')
ax.set_title('Эксперимент ЭКСП-1: время обслуживания одиночных бланков')
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('fig_4_1_exp1.png', dpi=150)
plt.close()

# ============================================================
# РИСУНОК 4.2 — Валидация M/M/1 (ЭКСП-2A)
# ============================================================
n = np.arange(1, 9)
T_exp = [171.37, 315.27, 458.48, 602.08, 745.50, 888.05, 1029.70, 1171.77]
mu_inv = 160.2
dt = 20.0
T_theor = [mu_inv + (k - 1) * (mu_inv - dt) for k in n]

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(n, T_theor, 'b--', marker='s', label='Теория M/M/1 (4.24)', linewidth=2)
ax.plot(n, T_exp, 'r-', marker='o', label='Эксперимент', linewidth=2)
ax.set_xlabel('Номер бланка $n$')
ax.set_ylabel('Время пребывания $T_n$, с')
ax.set_title('Эксперимент ЭКСП-2A: валидация модели M/M/1')
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('fig_4_2_exp2a.png', dpi=150)
plt.close()

# ============================================================
# РИСУНОК 4.3 — Точка коллапса масштабируемости
# ============================================================
T_c1 = [171.37, 315.27, 458.48, 602.08, 745.50, 888.05, 1029.70, 1171.77]
T_c2 = [683.60, 897.98, 1500.94, 1730.51, 2333.75, 2558.54, 3175.15, 3205.08]
T_c4 = [1800] * 8

fig, ax = plt.subplots(figsize=(9, 5.5))
ax.plot(n, T_c1, 'g-o', label='c = 1 (ЭКСП-2A)', linewidth=2)
ax.plot(n, T_c2, 'b-s', label='c = 2 (ЭКСП-2B)', linewidth=2)
ax.plot(n, T_c4, 'r-^', label='c = 4 (ЭКСП-2C, все OCR_FAILED)', linewidth=2)
ax.axhline(1800, color='red', linestyle=':', alpha=0.7, label='Timeout 1800 c')
ax.set_xlabel('Номер бланка $n$')
ax.set_ylabel('Время пребывания $T_n$, с')
ax.set_title('Сравнение времени обработки при разном числе воркеров')
ax.legend(loc='upper left')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('fig_4_3_scaling.png', dpi=150)
plt.close()

print("Готово: fig_4_1_exp1.png, fig_4_2_exp2a.png, fig_4_3_scaling.png")