import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import App from './App'
import Callback from './Callback'

export default () => (
  <Router>
    <Switch>
      <Route exact path="/callback/" component={Callback} />
      <Route exact path="*" component={App} />
    </Switch>
  </Router>
)
