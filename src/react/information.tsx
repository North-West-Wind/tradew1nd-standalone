import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default class InformationComponent extends React.Component<{ onClick: () => void }> {
	state: { markdown: string, onClick: () => void };

	constructor(props: { onClick: () => void } & object) {
		super(props);
		this.state = { markdown: "", onClick: props.onClick };
		fetch("https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/README.md").then(async res => {
			if (res.ok) this.setState({ markdown: await res.text() });
		});
	}

	render() {
		return <div className="overlay flex">
		<div className="close-button" onClick={() => this.state.onClick()}>x</div>
		<div className="in-overlay">
			<ReactMarkdown children={this.state.markdown} remarkPlugins={[remarkGfm]} />
		</div>
	</div>
	}
}