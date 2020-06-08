/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react'
import { inject, observer, Provider } from 'mobx-react'
import { Loading } from '@pitrix/lego-ui'

import { renderRoutes } from 'utils/router.config'

import ProjectStore from 'stores/project'
import FederatedStore from 'stores/federated'

import routes from './routes'

@inject('rootStore')
@observer
class ProjectLayout extends Component {
  constructor(props) {
    super(props)

    this.store = new ProjectStore()
    this.fedStore = new FederatedStore('namespaces')

    this.init(props.match.params)
  }

  componentDidUpdate(prevProps) {
    if (this.project !== prevProps.match.params.namespace) {
      this.init(this.props.match.params)
    }
  }

  async init(params) {
    this.store.initializing = true

    await this.store.fetchDetail(params)

    if (params.workspace) {
      await this.props.rootStore.getRules({
        workspace: params.workspace,
      })
    }

    await this.props.rootStore.getRules(params)

    if (this.store.detail.isFedManaged) {
      await this.fedStore.fetchDetail({ ...params, name: params.namespace })
      this.store.detail.clusters = this.fedStore.detail.clusters
    }

    globals.app.cacheHistory(this.props.match.url, {
      type: 'Project',
      name: this.store.detail.name,
      description: this.store.detail.description,
      isFedManaged: this.store.detail.isFedManaged,
    })

    this.store.initializing = false
  }

  get project() {
    return this.props.match.params.namespace
  }

  render() {
    const { initializing } = this.store

    if (initializing) {
      return <Loading className="ks-page-loading" />
    }

    return <Provider projectStore={this.store}>{renderRoutes(routes)}</Provider>
  }
}

export default ProjectLayout
