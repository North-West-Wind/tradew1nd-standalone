import React from "react";
import img from "../../public/images/tradew1nd.png";

export default class TradeW1ndPlaceholderComponent extends React.Component {
	render() {
		return <div className="flex-child center">
			<img src={img} id="tradew1nd-placeholder" /><br/>
			<h1>TradeW1nd Music Player</h1>
			<h3>Made by NorthWestWind</h3>
			<h3><a href="https://github.com/North-West-Wind/tradew1nd-standalone">GitHub Repository</a></h3>
		</div>
	}
}