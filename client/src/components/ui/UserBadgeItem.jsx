import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
//import "../../styles/components/ui/userBadgeItem.scss";

const UserBadgeItem = ({user, handler}) => {
  return (
    <Col className="userBadge-outer" xs={3}>
        <span>{user.name}</span>
        <Button className="userBadge-link" variant="link" onClick={handler}>X</Button>
    </Col>
  )
}

export default UserBadgeItem