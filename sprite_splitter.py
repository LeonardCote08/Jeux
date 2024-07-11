from PIL import Image
import os

def split_sprite_sheet(image_path, output_folder):
    # Ouvrir l'image
    with Image.open(image_path) as img:
        width, height = img.size
        
        # Calculer la taille de chaque sprite
        sprite_width = width // 5
        sprite_height = height // 5
        
        # Créer le dossier de sortie s'il n'existe pas
        os.makedirs(output_folder, exist_ok=True)
        
        # Découper l'image en 9 parties
        for i in range(5):
            for j in range(5):
                left = j * sprite_width
                top = i * sprite_height
                right = left + sprite_width
                bottom = top + sprite_height
                
                # Découper et sauvegarder chaque sprite
                sprite = img.crop((left, top, right, bottom))
                sprite.save(f"{output_folder}/sprite_{i}_{j}.png")

# Utilisation du programme
input_image = "C:/Users/leona/OneDrive/Bureau/multiple_trees.png"  # Remplacez par le chemin de votre image
output_folder = "sprites_decoupes_arbres"  # Le dossier où les sprites découpés seront sauvegardés

split_sprite_sheet(input_image, output_folder)
print(f"Les sprites ont été sauvegardés dans le dossier '{output_folder}'")