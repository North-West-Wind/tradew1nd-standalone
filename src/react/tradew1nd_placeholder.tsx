import React from "react";
import img from "../../public/images/tradew1nd.png";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import InformationComponent from "./information";

export default class TradeW1ndPlaceholderComponent extends React.Component {
	state: { markdown: string, showHelp: boolean };

	constructor(props: object) {
		super(props);
		this.state = { markdown: "", showHelp: false };
		fetch("https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/README.md").then(async res => {
			if (res.ok) this.setState({ markdown: await res.text() });
		});
	}

	toggleHelp() {
		this.setState({ showHelp: !this.state.showHelp });
	}

	render() {
		return <>
			<div className="flex-child center">
				<img src={img} id="tradew1nd-placeholder" onClick={() => this.toggleHelp()} /><br/>
				<h1>TradeW1nd Music Player</h1>
				<h3>Made by NorthWestWind</h3>
				<h3><a href="https://github.com/North-West-Wind/tradew1nd-standalone">GitHub Repository</a></h3>
			</div>
			{this.state.showHelp && <InformationComponent onClick={() => this.toggleHelp()} />}
		</>
	}
}