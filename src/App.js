import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import './App.css';

import { getExchangeRate } from './actions/getExchangeRate';
import { updateBalance } from './actions/updateBalance';

import ExchangeRate from './components/exchangeRate';
import ConvertForm from './components/convertForm';

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      from: 'GBP',
      to: 'EUR',
      toValue: '',
      fromValue: '',
    };
  }

  componentDidMount() {
    this.initExchangeRates();
    this.interval = this.updateExchangeRates(this.state.from, 10000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  initExchangeRates = () => {
    this.props.getExchangeRate(this.state.from);
    this.props.getExchangeRate(this.state.to);
  }

  updateExchangeRates = (currency, frequency) => {
    setInterval(() => this.props.getExchangeRate(currency), frequency);
  }

  updateIfNotExists = (updatedCurrency) => {
    if (!this.props.rates[updatedCurrency]) {
      this.props.getExchangeRate(updatedCurrency);
    }
  }

  handleExchangeRate = (e, fromInput, toInput) => {
    const value = e.target.value.replace('-', '');
    const baseCurrency = e.target.name;
    const toCurrency = baseCurrency === this.state.from ? this.state.to : this.state.from;
    const exhangeValue = parseFloat(value) * this.props.rates[baseCurrency][toCurrency];

    this.setState({
      [fromInput]: value,
      [toInput]: exhangeValue === 0 ? exhangeValue.toString() : exhangeValue.toFixed(2).toString(),
    });
  }

  handleCurrencyChange = (e, selectElement) => {
    const fromPreviousCurrency = this.state.from;
    const toPreviousCurrency = this.state.to;
    const nextCurrency = e.target.value;
    const opositySelectElement = selectElement === 'from' ? toPreviousCurrency : fromPreviousCurrency;

    if (opositySelectElement === nextCurrency) {
      this.setState({
        from: selectElement === 'from' ? nextCurrency : toPreviousCurrency,
        to: selectElement === 'from' ? fromPreviousCurrency : nextCurrency,
        fromValue: '',
        toValue: '',
      });
    } else {
      this.setState({
        [e.target.name]: e.target.value,
        fromValue: '',
        toValue: '',
      });
    }

    this.updateIfNotExists(nextCurrency);
  };

  handleExchangeButton = () => {
    const insufficientFunds = this.isDisabled();
    if (!insufficientFunds) {
      const {
        fromValue, from, toValue, to,
      } = this.state;
      const balance = {
        fromValue, from, toValue, to,
      };
      this.props.updateBalance(balance);

      this.setState({
        fromValue: '',
        toValue: '',
      });
    }
  };

  isDisabled = () => {
    const { fromValue, from } = this.state;
    const fromValueFloat = parseFloat(fromValue);
    const fromBalanceFloat = parseFloat(this.props.balance[from]);
    return !fromValueFloat || fromValueFloat > fromBalanceFloat;
  }

  render() {
    const {
      from, fromValue, to, toValue,
    } = this.state;

    return (
      <div className="App">
        <header>
          <h1 className="App-title">Exchange</h1>
        </header>

        <div className="App-convert">
          <ConvertForm
            selectName="from"
            selectedCurrency={from}
            inputValue={fromValue}
            handleCurrencyChange={e => this.handleCurrencyChange(e, 'from')}
            handleExchangeRate={e => this.handleExchangeRate(e, 'fromValue', 'toValue')}
            balance={this.props.balance[from]}
          />
          <span className="App-rates">
            <ExchangeRate from={from} to={to} rates={this.props.rates} />
          </span>
          <ConvertForm
            selectName="to"
            selectedCurrency={to}
            inputValue={toValue}
            handleCurrencyChange={e => this.handleCurrencyChange(e, 'to')}
            handleExchangeRate={e => this.handleExchangeRate(e, 'toValue', 'fromValue')}
            balance={this.props.balance[to]}
          />
          <button
            className="App-button"
            type="button"
            onClick={this.handleExchangeButton}
            disabled={this.isDisabled()}
          >
              Exchange
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ exchangeRate, balanceUpdate }) => ({
  rates: { ...exchangeRate },
  balance: { ...balanceUpdate },
});

const mapDispatchToProps = dispatch => ({
  getExchangeRate: base => dispatch(getExchangeRate(base)),
  updateBalance: data => dispatch(updateBalance(data)),
});

App.propTypes = {
  getExchangeRate: PropTypes.func.isRequired,
  updateBalance: PropTypes.func.isRequired,
  balance: PropTypes.object.isRequired,
  rates: PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
