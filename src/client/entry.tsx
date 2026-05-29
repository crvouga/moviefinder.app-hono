import { render } from 'hono/jsx/dom'
import { SearchInput } from '../search/client/search-input'


const root = document.getElementById('search-root')
if (root) render(<SearchInput />, root)
