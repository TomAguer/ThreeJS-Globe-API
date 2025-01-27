 <?php //Fichier inutilisé
header('Content-Type: application/json');
$servername = "localhost"; // ou l'adresse de ton serveur MySQL
$username = "root";        // ton utilisateur MySQL
$password = "root";            // ton mot de passe MySQL (si vide, laisse comme ça)
$dbname = "locationpop";   // nom de ta base de données

// Créer une connexion
$conn = new mysqli($servername, $username, $password, $dbname);

// Vérifier la connexion
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT id, name, countryname, latitude, longitude FROM location";
$result = $conn->query($sql);

$locations = [];

if ($result->num_rows > 0) {
    // Récupérer chaque ligne de la base de données
    while($row = $result->fetch_assoc()) {
        $locations[] = $row;
    }
}

// Convertir les données en JSON et les envoyer
echo json_encode($locations);

$conn->close();
?>
