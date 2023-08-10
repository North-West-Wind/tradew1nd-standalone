import React from "react";
import img from "../../public/images/tradew1nd.png";

export default class TradeW1ndPlaceholderComponent extends React.Component {
	render() {
		return <div className="flex-child center">
			<img src={img} id="tradew1nd-placeholder" /><br/>
			<h2>There's nothing playing</h2>
		</div>
	}
}