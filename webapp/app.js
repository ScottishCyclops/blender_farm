import m from 'mithril'
import Component from './component'

function main()
{
  const root = document.getElementById('app')

  m.mount(root, Component)
}

main()
