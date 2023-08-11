import { createRoot } from 'react-dom/client';
import TrackInfoComponent from './track_info';
import ListComponent from './list';
import { WindowExtra } from '../classes/window';
import { setDownloading, setPlaying, setQueues } from '../state';
import PlayerOptionsComponent from './player_options';

(window as WindowExtra).electronAPI.onUpdateQueues(queues => {
	setQueues(queues);
});
(window as WindowExtra).electronAPI.onUpdateStates(states => {
	if (states.downloading !== undefined) setDownloading(states.downloading);
	if (states.playing !== undefined) setPlaying(states.playing);
});

const container = document.getElementById('app');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<div className='container flex'>
	<TrackInfoComponent />
	<ListComponent />
	<PlayerOptionsComponent />
</div>);

(window as WindowExtra).electronAPI.requestQueues();
(window as WindowExtra).electronAPI.requestStates();