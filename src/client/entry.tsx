import { render } from 'hono/jsx/dom'
import { SearchInput } from '../search/client/search-input'
import { LoginForm } from '../auth/client/login-form'
import { authClient } from '../auth/client'
import { CreateListForm } from '../lists/client/create-list-form'
import { ListEditor } from '../lists/client/list-editor'

const searchRoot = document.getElementById('search-root')
if (searchRoot) render(<SearchInput />, searchRoot)

const loginRoot = document.getElementById('login-root')
if (loginRoot) render(<LoginForm />, loginRoot)

const createListRoot = document.getElementById('create-list-root')
if (createListRoot) render(<CreateListForm />, createListRoot)

const listEditorRoot = document.getElementById('list-editor-root')
if (listEditorRoot) {
  render(
    <ListEditor
      listId={listEditorRoot.dataset.listId ?? ''}
      actorId={listEditorRoot.dataset.actorId ?? ''}
    />,
    listEditorRoot,
  )
}

const signout = document.getElementById('signout')
if (signout) {
  signout.addEventListener('click', async (e) => {
    e.preventDefault()
    await authClient.signOut()
    window.location.href = '/'
  })
}
