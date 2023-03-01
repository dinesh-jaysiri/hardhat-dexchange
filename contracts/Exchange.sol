// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./Token.sol";


contract Exchange {
    // using SafeMath for uint256;
    // Variables
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage
    address constant ETHER = address(0); // store Ether in tokens mapping with blank address
    uint256 public orderCount;

    mapping(address => mapping(address => uint)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    //Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);

    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    event Trade(
        uint id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
    );
    //structs
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // deposit Ethers to contract
    function depositEther() public payable {
        tokens[ETHER][msg.sender] +=msg.value;
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    // withdrawEther
    function withdrawEther(uint256 _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount, "Exchange: insufficient balance");
        tokens[ETHER][msg.sender] -= _amount;
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Exchage: Failed to send Ether");
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    // deposit tokens to contract
    function depositToken(address _token, uint256 _amount) public {
        require(_token != ETHER, "Exchange: not allow to deposit ethers");
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] += _amount;

        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Withdraw Tokens
    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER, "Exchange: not allow to withdraw ethers");
        require(tokens[_token][msg.sender] >= _amount, "Exchange: insufficient balance");
        tokens[_token][msg.sender] -= _amount;
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    //make order
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        orderCount ++;
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    //cancel Order
    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id];
        require(_order.id == _id, "Exchange: order must exist");
        require(address(_order.user) == msg.sender, "Exchange: only creater to allow cancel order");

        orderCancelled[_id] = true;

        emit Cancel(
            _order.id,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp
        );
    }

    // fill orders
    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount, "Exchange: invalid id");
        require(!orderFilled[_id], "Exchange: filled order");
        require(!orderCancelled[_id], "Exchange: cancelled order");
        _Order storage _order = orders[_id];
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );
        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        // Execute trade

      // Fee is paid by the user who filled the order (msg.sender)
        // Fee is deducted from _amountGet
        uint256 _feeAmount = (_amountGet * feePercent) / 100;

        // Execute the trade
        // msg.sender is the user who filled the order, while _user is who created the order
        tokens[_tokenGet][msg.sender] =
            tokens[_tokenGet][msg.sender] -
            (_amountGet + _feeAmount);

        tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;

        // Charge fees
        tokens[_tokenGet][feeAccount] =
            tokens[_tokenGet][feeAccount] +
            _feeAmount;

        tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
        tokens[_tokenGive][msg.sender] =
            tokens[_tokenGive][msg.sender] +
            _amountGive;

        emit Trade(
            _orderId,
            _user,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            msg.sender,
            block.timestamp
        );
    }

    // 25 8:10

    // Fallback: reverts if Ether is sent to this smart conntract by mistake
    fallback() external payable {}

    receive() external payable {}
}
