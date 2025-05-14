"use client"

import { useState, useEffect } from "react"

const formatNumber = (number) => {
  const numStr = number.toString()

  if (numStr === "Infinity" || numStr === "-Infinity" || numStr === "NaN") {
    return "Erro"
  }

  const maxDigits = 12

  if (Math.abs(number) >= 1e12) {
    return number.toExponential(6)
  }

  if (Number.isInteger(number)) {
    return number.toString()
  }

  const parts = numStr.split(".")
  if (parts[0].length >= maxDigits) {
    return number.toExponential(6)
  }

  const decimalPlaces = Math.min(maxDigits - parts[0].length - 1, 10)
  return number.toFixed(decimalPlaces).replace(/\.?0+$/, "")
}

const getOperatorSymbol = (operator) => {
  const symbols = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
  }
  return symbols[operator] || operator
}

function App() {
  const [theme, setTheme] = useState("light")
  const [display, setDisplay] = useState("0")
  const [history, setHistory] = useState("")
  const [currentOperand, setCurrentOperand] = useState("0")
  const [previousOperand, setPreviousOperand] = useState("")
  const [operation, setOperation] = useState(null)
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!localStorage.getItem("theme") && prefersDark)) {
      setTheme("dark")
    } else {
      setTheme("light")
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (/[0-9.]/.test(event.key)) {
        event.preventDefault()
        appendNumber(event.key)
      }

      if (["+", "-", "*", "/"].includes(event.key)) {
        event.preventDefault()
        chooseOperation(event.key)
      }

      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault()
        calculate()
      }

      // Backspace para apagar
      if (event.key === "Backspace") {
        event.preventDefault()
        backspace()
      }

      // Escape ou Delete para limpar
      if (event.key === "Escape" || event.key === "Delete") {
        event.preventDefault()
        clear()
      }

      // % para porcentagem
      if (event.key === "%") {
        event.preventDefault()
        percent()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentOperand, previousOperand, operation, shouldResetDisplay, lastResult, display])

  // Alternar tema
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // Adiciona um número ao display
  const appendNumber = (number) => {
    if (currentOperand === "Erro") return;

    if (shouldResetDisplay) {
      setDisplay(number === "." ? "0." : number)
      setCurrentOperand(number === "." ? "0." : number)
      setShouldResetDisplay(false)
      return
    }

    if (display.includes(".") && number === ".") return

    const newDisplay = display === "0" && number !== "." ? number : display + number

    setDisplay(newDisplay)
    setCurrentOperand(newDisplay)
  }


  // Escolhe uma operação
  const chooseOperation = (op) => {
    if (currentOperand === "Erro") return

    if (operation !== null && !shouldResetDisplay) {
      calculate()
    }

    setPreviousOperand(currentOperand)
    setOperation(op)
    setShouldResetDisplay(true)
    setHistory(`${currentOperand} ${getOperatorSymbol(op)}`)
  }

  // Realiza o cálculo
  const calculate = () => {
    if (operation === null || shouldResetDisplay || currentOperand === "Erro") return

    const prev = Number.parseFloat(previousOperand)
    const current = Number.parseFloat(currentOperand)
    let result

    switch (operation) {
      case "+":
        result = prev + current
        break
      case "-":
        result = prev - current
        break
      case "*":
        result = prev * current
        break
      case "/":
        if (current === 0) {
          result = "Erro"
        } else {
          result = prev / current
        }
        break
      default:
        return
    }

    // Atualiza o histórico
    setHistory(`${previousOperand} ${getOperatorSymbol(operation)} ${currentOperand} =`)

    // Formata e exibe o resultado
    if (result === "Erro") {
      setDisplay("Erro")
    } else {
      setLastResult(result)
      setDisplay(formatNumber(result))
    }

    setCurrentOperand(result === "Erro" ? "Erro" : formatNumber(result))
    setOperation(null)
    setShouldResetDisplay(true)
  }

  // Limpa a calculadora
  const clear = () => {
    setDisplay("0")
    setHistory("")
    setCurrentOperand("0")
    setPreviousOperand("")
    setOperation(null)
    setShouldResetDisplay(false)
    setLastResult(null)
  }

  // Remove o último dígito
  const backspace = () => {
    if (shouldResetDisplay || currentOperand === "Erro") {
      clear()
      return
    }

    if (display.length === 1) {
      setDisplay("0")
      setCurrentOperand("0")
    } else {
      setDisplay((prev) => prev.slice(0, -1))
      setCurrentOperand((prev) => prev.slice(0, -1))
    }
  }

  // Calcula a porcentagem
  const percent = () => {
    if (currentOperand === "Erro") return

    const current = Number.parseFloat(currentOperand)
    let result

    if (operation === "+" || operation === "-") {
      // Para adição e subtração, calcule a porcentagem do número anterior
      result = Number.parseFloat(previousOperand) * (current / 100)
    } else {
      // Para outros casos, apenas divida por 100
      result = current / 100
    }

    setDisplay(formatNumber(result))
    setCurrentOperand(formatNumber(result))
  }

  // Calcula a raiz quadrada
  const squareRoot = () => {
    if (currentOperand === "Erro") return

    const current = Number.parseFloat(currentOperand)

    if (current < 0) {
      setDisplay("Erro")
      setCurrentOperand("Erro")
    } else {
      const result = Math.sqrt(current)
      setDisplay(formatNumber(result))
      setCurrentOperand(formatNumber(result))
    }

    setShouldResetDisplay(true)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-100 dark:bg-custom-dark transition-colors`}>
      <div className="w-full max-w-md p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-colors">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Calculadora</h1>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
              aria-label="Alternar tema"
            >
              {theme === "light" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Histórico */}
          <div className="px-4 py-2 min-h-6 border-b border-gray-200 dark:border-gray-700">
            <div className="font-mono text-sm text-right text-gray-600 dark:text-gray-400 opacity-70 truncate">
              {history}
            </div>
          </div>

          {/* Display */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="font-mono text-4xl font-semibold text-right text-gray-900 dark:text-white truncate">
              {display}
            </div>
          </div>

          {/* Botões */}
          <div className="grid grid-cols-4 gap-2 p-4">
            {/* Linha 1 */}
            <button
              onClick={clear}
              className="w-full h-14 rounded border border-red-200 dark:border-red-900 bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-200 text-xl font-medium transition-colors"
            >
              C
            </button>
            <button
              onClick={backspace}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
            </button>
            <button
              onClick={percent}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              %
            </button>
            <button
              onClick={() => chooseOperation("/")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              ÷
            </button>

            {/* Linha 2 */}
            <button
              onClick={() => appendNumber("7")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              7
            </button>
            <button
              onClick={() => appendNumber("8")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              8
            </button>
            <button
              onClick={() => appendNumber("9")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              9
            </button>
            <button
              onClick={() => chooseOperation("*")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              ×
            </button>

            {/* Linha 3 */}
            <button
              onClick={() => appendNumber("4")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              4
            </button>
            <button
              onClick={() => appendNumber("5")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              5
            </button>
            <button
              onClick={() => appendNumber("6")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              6
            </button>
            <button
              onClick={() => chooseOperation("-")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              −
            </button>

            {/* Linha 4 */}
            <button
              onClick={() => appendNumber("1")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              1
            </button>
            <button
              onClick={() => appendNumber("2")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              2
            </button>
            <button
              onClick={() => appendNumber("3")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              3
            </button>
            <button
              onClick={() => chooseOperation("+")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              +
            </button>

            {/* Linha 5 */}
            <button
              onClick={squareRoot}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-500 dark:text-custom-purple text-xl font-medium transition-colors"
            >
              √
            </button>
            <button
              onClick={() => appendNumber("0")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              0
            </button>
            <button
              onClick={() => appendNumber(".")}
              className="w-full h-14 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-medium transition-colors"
            >
              .
            </button>
            <button
              onClick={calculate}
              className="w-full h-14 rounded border border-indigo-400 dark:border-indigo-600 bg-indigo-500 dark:bg-indigo-600 text-white text-xl font-medium transition-colors hover:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              =
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
